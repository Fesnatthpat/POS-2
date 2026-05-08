import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    const query = getQuery(event)
    const productId = query.productId ? Number(query.productId) : undefined

    return await prisma.stockMovement.findMany({
      where: productId ? { productId } : {},
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to 100 latest movements
    })
  }
})
