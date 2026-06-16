import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedAdminIfEmpty() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';
  const phone = process.env.ADMIN_PHONE || '';

  if (!email || !password) return;

  const count = await prisma.user.count();
  if (count > 0) return;

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hash, phone, language: 'fr' }
  });
  console.log(`✅ Admin user created: ${email}`);
}
