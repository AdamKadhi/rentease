import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emitToOwner } from '../socket.js';

const prisma = new PrismaClient();

function parseArr(raw) {
  try { return JSON.parse(raw ?? '[]'); } catch { return []; }
}
const parsePhotos = parseArr;

async function resolveSiteOwner() {
  const configuredId = process.env.OWNER_ID?.trim();
  if (configuredId) {
    const user = await prisma.user.findUnique({ where: { id: configuredId }, select: { id: true, name: true, phone: true } });
    if (user) return user;
  }
  return prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, phone: true } });
}

export async function getSiteHouses(req, res) {
  const owner = await resolveSiteOwner();
  if (!owner) return res.status(404).json({ error: 'Aucun propriétaire configuré' });

  const houses = await prisma.house.findMany({
    where: { ownerId: owner.id },
    include: { monthlyPrices: { orderBy: { month: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ owner, houses: houses.map(h => ({ ...h, photos: parseArr(h.photos), amenities: parseArr(h.amenities) })) });
}

export async function getSiteHouse(req, res) {
  const owner = await resolveSiteOwner();
  if (!owner) return res.status(404).json({ error: 'Aucun propriétaire configuré' });

  const house = await prisma.house.findFirst({
    where: { id: req.params.houseId, ownerId: owner.id },
    include: {
      monthlyPrices: { orderBy: { month: 'asc' } },
      bookings: {
        where: { status: { in: ['confirmed', 'pending'] } },
        select: { checkIn: true, checkOut: true },
        orderBy: { checkIn: 'asc' },
      },
    },
  });
  if (!house) return res.status(404).json({ error: 'Propriété introuvable' });

  res.json({ ...house, photos: parseArr(house.photos), amenities: parseArr(house.amenities), owner });
}


export async function getPublicOwner(req, res) {
  const { ownerId } = req.params;
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { id: true, name: true },
  });
  if (!owner) return res.status(404).json({ error: 'Propriétaire introuvable' });

  const houses = await prisma.house.findMany({
    where: { ownerId },
    include: {
      monthlyPrices: { orderBy: { month: 'asc' } },
      _count: {
        select: {
          bookings: { where: { status: { in: ['confirmed', 'pending'] } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    owner,
    houses: houses.map(h => ({ ...h, photos: parsePhotos(h.photos) })),
  });
}

export async function getPublicHouse(req, res) {
  const { ownerId, houseId } = req.params;
  const house = await prisma.house.findFirst({
    where: { id: houseId, ownerId },
    include: {
      monthlyPrices: { orderBy: { month: 'asc' } },
      bookings: {
        where: { status: { in: ['confirmed', 'pending'] } },
        select: { checkIn: true, checkOut: true },
        orderBy: { checkIn: 'asc' },
      },
    },
  });
  if (!house) return res.status(404).json({ error: 'Propriété introuvable' });

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { name: true },
  });

  res.json({ ...house, photos: parseArr(house.photos), amenities: parseArr(house.amenities), owner });
}

export async function checkPublicAvailability(req, res) {
  const { houseId, checkIn, checkOut } = req.query;
  if (!houseId || !checkIn || !checkOut)
    return res.status(400).json({ error: 'Paramètres manquants' });

  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (isNaN(ci) || isNaN(co) || co <= ci)
    return res.status(400).json({ error: 'Dates invalides' });

  const conflict = await prisma.booking.findFirst({
    where: {
      houseId,
      status: { in: ['confirmed', 'pending'] },
      checkIn: { lt: co },
      checkOut: { gt: ci },
    },
    select: { checkIn: true, checkOut: true },
  });

  res.json({ available: !conflict, conflict: conflict || null });
}

export async function createPublicBooking(req, res) {
  const schema = z.object({
    houseId: z.string().min(1),
    guestName: z.string().min(1),
    phone: z.string().min(1),
    checkIn: z.string(),
    checkOut: z.string(),
    persons: z.number().int().positive().optional().nullable(),
    notes: z.string().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { houseId, guestName, phone, checkIn, checkOut, persons, notes } = result.data;
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (co <= ci) return res.status(400).json({ error: 'Dates invalides' });

  const house = await prisma.house.findUnique({
    where: { id: houseId },
    include: { monthlyPrices: true },
  });
  if (!house) return res.status(404).json({ error: 'Propriété introuvable' });

  const conflict = await prisma.booking.findFirst({
    where: {
      houseId,
      status: { in: ['confirmed', 'pending'] },
      checkIn: { lt: co },
      checkOut: { gt: ci },
    },
  });
  if (conflict) return res.status(409).json({ error: 'Ces dates ne sont pas disponibles' });

  const nights = Math.round((co - ci) / 86400000);
  const month = ci.getMonth() + 1;
  const monthPrice = house.monthlyPrices.find(mp => mp.month === month)?.price ?? house.pricePerNight;
  const totalAmount = nights * monthPrice;

  const booking = await prisma.booking.create({
    data: {
      houseId,
      guestName,
      phone,
      checkIn: ci,
      checkOut: co,
      persons: persons ?? null,
      notes: notes ?? null,
      totalAmount,
      amountPaid: 0,
      status: 'pending',
    },
  });

  emitToOwner(house.ownerId, 'booking:created', { ...booking, house: { id: house.id, name: house.name, color: house.color } });
  res.status(201).json({ ...booking, totalAmount, nights, pricePerNight: monthPrice });
}
