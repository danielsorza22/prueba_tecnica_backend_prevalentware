import { PrismaClient } from '@prisma/client';
import { seedUsers, functions } from './seed_data';

const prisma = new PrismaClient();

async function main() {
  await seedUsers(prisma);
  await functions(prisma);
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
