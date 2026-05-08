import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // GET: ดึงข้อมูลลูกค้าทั้งหมด
  if (method === 'GET') {
    return await prisma.customer.findMany({
      orderBy: { points: 'desc' },
      include: { pointLogs: { orderBy: { timestamp: 'desc' }, take: 10 } }
    })
  }

  // POST: เพิ่มลูกค้าใหม่
  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.name || !body.phone) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุชื่อและเบอร์โทรศัพท์' })
    }
    return await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        level: body.level || 'Silver',
      }
    })
  }

  // PUT: แก้ไขข้อมูลลูกค้า หรือ จัดการคะแนน
  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updates } = body
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ ID ลูกค้า' })
    }
    
    // กรณีแลกคะแนน (Redeem)
    if (updates.action === 'redeem') {
      return await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: Number(id) } })
        if (!customer) throw createError({ statusCode: 404, statusMessage: 'ไม่พบข้อมูลลูกค้า' })
        if (customer.points < updates.points) throw createError({ statusCode: 400, statusMessage: 'คะแนนไม่เพียงพอ' })
        
        const newPoints = customer.points - updates.points
        await tx.pointLog.create({
          data: {
            customerId: Number(id),
            amount: -updates.points,
            after: newPoints,
            note: updates.note || 'แลกรางวัลสมาชิกล่วงหน้า'
          }
        })

        return await tx.customer.update({
          where: { id: Number(id) },
          data: { points: newPoints, rewardsEarned: { increment: 1 } }
        })
      })
    }

    // อัปเดตข้อมูลทั่วไป
    return await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        name: updates.name,
        phone: updates.phone,
        level: updates.level,
        points: updates.points !== undefined ? Number(updates.points) : undefined
      }
    })
  }

  // DELETE: ลบข้อมูลลูกค้า
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ ID ที่ต้องการลบ' })
    }
    return await prisma.customer.delete({
      where: { id: Number(id) }
    })
  }
})
