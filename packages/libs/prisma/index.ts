import { PrismaClient } from "@prisma/client"

declare global {
  var prismadb: PrismaClient | undefined
}

const prisma = globalThis.prismadb ?? new PrismaClient()

if (process.env.NODE_ENV === "production") {
  globalThis.prismadb = prisma
}

export default prisma
