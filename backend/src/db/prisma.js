import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

let prisma;

export function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function checkPrisma() {
  const client = getPrisma();
  await client.$queryRaw`SELECT 1`;
  return { ok: true };
}

export async function disconnectPrisma() {
  if (prisma) await prisma.$disconnect();
}