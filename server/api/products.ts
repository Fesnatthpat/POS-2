import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { Category: true }
    })
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event)
      console.log('Creating product with body:', body)

      if (!body.name || !body.price) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ชื่อสินค้าและราคาเป็นข้อมูลที่จำเป็น'
        })
      }

      // Find or create category
      let categoryId = null
      if (body.category) {
        let cat = await prisma.category.findUnique({
          where: { name: body.category }
        })
        
        if (!cat) {
          console.log(`Category "${body.category}" not found, creating...`)
          cat = await prisma.category.create({
            data: { name: body.category }
          })
        }
        categoryId = cat.id
      }

      const product = await prisma.product.create({
        data: {
          name: body.name,
          category: body.category || 'อื่นๆ',
          categoryId: categoryId,
          price: Number(body.price),
          cost: Number(body.cost || 0),
          stock: Number(body.stock || 0),
          minStockThreshold: Number(body.minStockThreshold || 5),
          barcode: body.barcode || null,
          sku: body.sku || null,
          image: body.image || null,
          // Create initial movement if stock is provided
          movements: Number(body.stock) > 0 ? {
            create: {
              productName: body.name,
              type: 'In',
              quantity: Number(body.stock),
              previousStock: 0,
              newStock: Number(body.stock),
              costAtTime: Number(body.cost || 0),
              note: 'ตั้งค่าสต็อกเริ่มต้น'
            }
          } : undefined
        }
      })
      
      console.log('Product created successfully:', product.id)
      return product
    } catch (error: any) {
      console.error('Error creating product:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: `Failed to create product: ${error.message}`
      })
    }
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updates } = body
    
    // Convert numbers if present
    if (updates.price) updates.price = Number(updates.price)
    if (updates.cost) updates.cost = Number(updates.cost)
    if (updates.stock) updates.stock = Number(updates.stock)
    if (updates.minStockThreshold) updates.minStockThreshold = Number(updates.minStockThreshold)

    return await prisma.product.update({
      where: { id: Number(id) },
      data: updates
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    return await prisma.product.delete({
      where: { id: Number(query.id) }
    })
  }
})
