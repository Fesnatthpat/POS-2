import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPassword = 'password123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      role: 'Admin',
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'ผู้ดูแลระบบ',
      role: 'Admin',
      status: 'Active',
    },
  })

  console.log('Admin user created/updated:', admin.username)
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
