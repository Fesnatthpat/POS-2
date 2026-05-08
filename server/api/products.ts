import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    try {
      return await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { Category: true }
      })
    } catch (error: any) {
      console.error('Error fetching products:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch products: ${error.message}`
      })
    }
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event)
      console.log('Creating product with body:', body)

      if (!body.name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'กรุณาระบุชื่อสินค้า'
        })
      }

      if (body.price === undefined || body.price === null) {
        throw createError({
          statusCode: 400,
          statusMessage: 'กรุณาระบุราคาสินค้า'
        })
      }

      // Find or create category
      let categoryId = null
      const categoryName = body.category || 'อื่นๆ'
      
      try {
        let cat = await prisma.category.findUnique({
          where: { name: categoryName }
        })
        
        if (!cat) {
          console.log(`Category "${categoryName}" not found, creating...`)
          cat = await prisma.category.create({
            data: { name: categoryName }
          })
        }
        categoryId = cat.id
      } catch (catError) {
        console.error('Error handling category:', catError)
        // Continue even if category fails, we have the string field
      }

      const product = await prisma.product.create({
        data: {
          name: body.name,
          category: categoryName,
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
      
      // Check for uniqueness constraint
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'ข้อมูล'
        throw createError({
          statusCode: 400,
          statusMessage: `${field === 'barcode' ? 'บาร์โค้ด' : field === 'sku' ? 'SKU' : field} นี้มีอยู่ในระบบแล้ว`
        })
      }

      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: error.statusMessage || `Failed to create product: ${error.message}`
      })
    }
  }

  if (method === 'PUT') {
    try {
      const body = await readBody(event)
      const { id, ...updates } = body
      
      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing product ID' })
      }

      // Convert numbers if present
      if (updates.price !== undefined) updates.price = Number(updates.price)
      if (updates.cost !== undefined) updates.cost = Number(updates.cost)
      if (updates.stock !== undefined) updates.stock = Number(updates.stock)
      if (updates.minStockThreshold !== undefined) updates.minStockThreshold = Number(updates.minStockThreshold)

      // Remove Category relation object if it's in the updates to avoid Prisma error
      delete updates.Category

      return await prisma.product.update({
        where: { id: Number(id) },
        data: updates
      })
    } catch (error: any) {
      console.error('Error updating product:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        statusMessage: `Failed to update product: ${error.message}`
      })
    }
  }

  if (method === 'DELETE') {
    try {
      const query = getQuery(event)
      if (!query.id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing product ID' })
      }
      return await prisma.product.delete({
        where: { id: Number(query.id) }
      })
    } catch (error: any) {
      console.error('Error deleting product:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to delete product: ${error.message}`
      })
    }
  }
})
