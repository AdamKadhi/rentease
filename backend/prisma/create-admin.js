import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const NAME     = process.env.ADMIN_NAME     || 'Admin';
const EMAIL    = process.env.ADMIN_EMAIL    || 'admin@gesloc.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const PHONE    = process.env.ADMIN_PHONE    || '';

const hash = await bcrypt.hash(PASSWORD, 10);

const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
if (existing) {
  console.log('User already exists:', existing.email);
} else {
  const user = await prisma.user.create({
    data: { name: NAME, email: EMAIL, password: hash, phone: PHONE, language: 'fr' }
  });
  console.log('✅ Admin created:', user.email, '| id:', user.id);
}

await prisma.$disconnect();
