import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  // GET: ดึงค่าตั้งค่าร้านค้า (ถ้ายังไม่มีจะสร้างค่าเริ่มต้นให้)
  if (method === 'GET') {
    let settings = await prisma.storeSettings.findFirst()
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          name: 'Vendora POS',
          currency: 'THB',
          taxRate: 7,
          includeTax: true,
          loyaltyPointRate: 20,
          loyaltyPointThreshold: 100
        }
      })
    }
    return settings
  }

  // POST หรือ PUT: อัปเดตค่าตั้งค่าร้านค้า
  if (method === 'POST' || method === 'PUT') {
    const body = await readBody(event)
    const existing = await prisma.storeSettings.findFirst()
    
    if (existing) {
      return await prisma.storeSettings.update({
        where: { id: existing.id },
        data: body
      })
    } else {
      return await prisma.storeSettings.create({
        data: body
      })
    }
  }

  // DELETE: ลบค่าตั้งค่า (ปกติไม่แนะนำให้ใช้)
  if (method === 'DELETE') {
     const existing = await prisma.storeSettings.findFirst()
     if (existing) {
       return await prisma.storeSettings.delete({
         where: { id: existing.id }
       })
     }
     return { message: 'ไม่มีข้อมูลให้ลบ' }
  }
})
