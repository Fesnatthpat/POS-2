import { createRequire } from 'module'
import type { PrismaClient as PrismaClientType } from '../../prisma/generated/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../../prisma/generated/client') as { PrismaClient: new (options?: any) => PrismaClientType }

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma