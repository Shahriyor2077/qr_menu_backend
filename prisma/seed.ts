import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@qrmenu.uz';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('SuperAdmin allaqachon mavjud:', email);
    return;
  }

  const password = await bcrypt.hash('superadmin123', 10);

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      password,
      role: 'SUPERADMIN',
    },
  });

  console.log('✅ SuperAdmin yaratildi!');
  console.log('Email:', email);
  console.log('Parol: superadmin123');
  console.log('⚠️  Parolni albatta o\'zgartiring!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
