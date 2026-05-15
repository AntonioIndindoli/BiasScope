let prisma;
let PrismaClientCtor;

async function ensurePrismaClientCtor() {
  if (PrismaClientCtor) return PrismaClientCtor;
  const prismaPkg = await import('@prisma/client');
  PrismaClientCtor = prismaPkg.PrismaClient;
  return PrismaClientCtor;
}

export async function getPrismaAsync() {
  if (!prisma) {
    const PrismaClient = await ensurePrismaClientCtor();
    prisma = new PrismaClient();
  }
  return prisma;
}

export function getPrisma() {
  if (!prisma) {
    throw new Error('Prisma client is not initialized. Call getPrismaAsync() before database operations.');
  }
  return prisma;
}

export async function checkPrisma() {
  const client = await getPrismaAsync();
  await client.$queryRaw`SELECT 1`;
  return { ok: true };
}

export async function disconnectPrisma() {
  if (prisma) await prisma.$disconnect();
}
