import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Alimentação', type: 'EXPENSE' },
    { name: 'Transporte', type: 'EXPENSE' },
    { name: 'Moradia', type: 'EXPENSE' },
    { name: 'Saúde', type: 'EXPENSE' },
    { name: 'Lazer', type: 'EXPENSE' },
    { name: 'Educação', type: 'EXPENSE' },
    { name: 'Salário', type: 'INCOME' },
    { name: 'Outros', type: 'EXPENSE' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
}

main()
  .then(() => console.log('✅ Seed concluído'))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
