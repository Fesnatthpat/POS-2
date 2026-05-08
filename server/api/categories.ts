import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // GET: ดึงข้อมูลหมวดหมู่ทั้งหมด
  if (method === 'GET') {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // POST: เพิ่มหมวดหมู่ใหม่
  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุชื่อหมวดหมู่' })
    }
    return await prisma.category.create({
      data: { name: body.name }
    })
  }

  // PUT: แก้ไขหมวดหมู่
  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, name } = body
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ ID ที่ต้องการแก้ไข' })
    }
    return await prisma.category.update({
      where: { id: Number(id) },
      data: { name }
    })
  }

  // DELETE: ลบหมวดหมู่
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุ ID ที่ต้องการลบ' })
    }
    return await prisma.category.delete({
      where: { id: Number(id) }
    })
  }
})
