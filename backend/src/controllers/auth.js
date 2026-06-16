import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === 'production';
const cookieOpts = {
  httpOnly: true,
  maxAge: 7 * 24 * 3600 * 1000,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
};

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  language: z.enum(['fr', 'ar']).default('fr'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function register(req, res) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { name, email, password, language } = result.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'Email déjà utilisé' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, language },
    select: { id: true, name: true, email: true, language: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id);
  res.cookie('refreshToken', refreshToken, cookieOpts);
  res.json({ accessToken, user });
}

export async function login(req, res) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { email, password } = result.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

  const { accessToken, refreshToken } = generateTokens(user.id);
  res.cookie('refreshToken', refreshToken, cookieOpts);
  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, language: user.language },
  });
}

export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'Non autorisé' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, language: true },
    });
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    res.cookie('refreshToken', refreshToken, cookieOpts);
    res.json({ accessToken, user });
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

export async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ message: 'Déconnecté' });
}

export async function updateLanguage(req, res) {
  const { language } = req.body;
  if (!['fr', 'ar'].includes(language)) return res.status(400).json({ error: 'Langue invalide' });

  await prisma.user.update({ where: { id: req.userId }, data: { language } });
  res.json({ language });
}

export async function updateProfile(req, res) {
  const schema = z.object({
    name:  z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { name, email, phone } = result.data;
  const existing = await prisma.user.findFirst({ where: { email, NOT: { id: req.userId } } });
  if (existing) return res.status(400).json({ error: 'Email déjà utilisé par un autre compte' });

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name, email, phone },
    select: { id: true, name: true, email: true, phone: true, language: true },
  });
  res.json({ user });
}

export async function changePassword(req, res) {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(6),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { currentPassword, newPassword } = result.data;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
  res.json({ message: 'Mot de passe modifié avec succès' });
}
