import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return await prisma.staff.findMany({
      orderBy: { name: 'asc' }
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)
    return await prisma.staff.create({
      data: {
        name: body.name,
        username: body.username,
        password: body.password, // Should be hashed in real app
        role: body.role || 'Cashier',
        status: 'Active'
      }
    })
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updates } = body
    return await prisma.staff.update({
      where: { id: Number(id) },
      data: updates
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    return await prisma.staff.delete({
      where: { id: Number(query.id) }
    })
  }
})
