import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // GET: ดึงข้อมูลคำสั่งซื้อทั้งหมด
  if (method === 'GET') {
    return await prisma.order.findMany({
      orderBy: { timestamp: 'desc' },
      include: { customer: true }
    })
  }

  // POST: สร้างคำสั่งซื้อใหม่ (พร้อมตัดสต็อกและเพิ่มคะแนน)
  if (method === 'POST') {
    const body = await readBody(event)
    
    if (!body.items || !Array.isArray(body.items)) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุรายการสินค้า' })
    }

    return await prisma.$transaction(async (tx) => {
      // 1. สร้าง Order
      const order = await tx.order.create({
        data: {
          items: body.items,
          subtotal: body.subtotal,
          discount: body.discount,
          total: body.total,
          totalCost: body.totalCost,
          profit: body.profit,
          paymentMethod: body.paymentMethod,
          paymentSlip: body.paymentSlip,
          receivedAmount: body.receivedAmount,
          changeDue: body.changeDue,
          notes: body.notes,
          customerId: body.customerId ? Number(body.customerId) : undefined,
        }
      })

      // 2. ตัดสต็อกสินค้าแต่ละรายการ
      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.id } })
        if (product) {
          const prevStock = product.stock
          const newStock = Math.max(0, product.stock - item.quantity)
          
          await tx.product.update({
            where: { id: item.id },
            data: { stock: newStock }
          })

          // บันทึกความเคลื่อนไหวสต็อก
          await tx.stockMovement.create({
            data: {
              productId: item.id,
              productName: product.name,
              type: 'Sale',
              quantity: -item.quantity,
              previousStock: prevStock,
              newStock: newStock,
              costAtTime: product.cost,
              note: `รายการขายบิล #${order.id}`
            }
          })
        }
      }

      // 3. เพิ่มคะแนนให้ลูกค้า (ถ้ามี)
      if (body.customerId && body.pointsEarned) {
        const customerId = Number(body.customerId)
        const customer = await tx.customer.findUnique({ where: { id: customerId } })
        if (customer) {
          const newPoints = customer.points + body.pointsEarned
          await tx.customer.update({
            where: { id: customerId },
            data: { points: newPoints }
          })

          // บันทึกประวัติคะแนน
          await tx.pointLog.create({
            data: {
              customerId: customerId,
              amount: body.pointsEarned,
              after: newPoints,
              note: `ซื้อสินค้าบิล #${order.id}`
            }
          })
        }
      }

      return order
    })
  }

  // PUT: แก้ไขข้อมูล Order หรือ ยกเลิกบิล (Void)
  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updates } = body
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ ID บิล' })
    }

    // กรณีต้องการยกเลิกบิล (Void)
    if (updates.status === 'voided') {
      return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id } })
        if (!order || order.status === 'voided') return order

        // คืนสต็อกสินค้า
        const items = order.items as any[]
        for (const item of items) {
          const product = await tx.product.findUnique({ where: { id: item.id } })
          if (product) {
            const prevStock = product.stock
            const newStock = product.stock + item.quantity
            
            await tx.product.update({
              where: { id: item.id },
              data: { stock: newStock }
            })

            await tx.stockMovement.create({
              data: {
                productId: item.id,
                productName: product.name,
                type: 'Adjustment',
                quantity: item.quantity,
                previousStock: prevStock,
                newStock: newStock,
                costAtTime: product.cost,
                note: `ยกเลิกบิล #${order.id}`
              }
            })
          }
        }

        return await tx.order.update({
          where: { id },
          data: { status: 'voided', voidedAt: new Date() }
        })
      })
    }

    // อัปเดตข้อมูลทั่วไป
    return await prisma.order.update({
      where: { id },
      data: updates
    })
  }

  // DELETE: ลบบิล (ควรระวังการใช้งาน)
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ ID ที่ต้องการลบ' })
    }
    return await prisma.order.delete({
      where: { id }
    })
  }
})
