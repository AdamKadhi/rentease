import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emitToOwner, emitPublic } from '../socket.js';

const prisma = new PrismaClient();

const houseSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  bedrooms: z.number().int().positive(),
  pricePerNight: z.number().positive(),
  color: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional().nullable(),
  monthlyPrices: z.array(z.object({
    month: z.number().int().min(1).max(12),
    price: z.number().positive(),
  })).optional(),
});

function serialize(arr) {
  return JSON.stringify(arr ?? []);
}
function parseArr(raw) {
  try { return JSON.parse(raw ?? '[]'); } catch { return []; }
}
// keep old name for compat
const serializePhotos = serialize;
function withPhotos(house) {
  return { ...house, photos: parseArr(house.photos), amenities: parseArr(house.amenities) };
}

export async function getHouses(req, res) {
  const houses = await prisma.house.findMany({
    where: { ownerId: req.userId },
    include: {
      monthlyPrices: { orderBy: { month: 'asc' } },
      bookings: {
        where: { status: { in: ['confirmed', 'pending'] } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(houses.map(withPhotos));
}

export async function createHouse(req, res) {
  const result = houseSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { monthlyPrices, photos, amenities, ...houseData } = result.data;
  const photosArr = photos ?? (houseData.photoUrl ? [houseData.photoUrl] : []);

  const house = await prisma.house.create({
    data: {
      ...houseData,
      photoUrl: photosArr[0] ?? houseData.photoUrl ?? null,
      photos: serialize(photosArr),
      amenities: serialize(amenities ?? []),
      ownerId: req.userId,
      monthlyPrices: monthlyPrices?.length
        ? { create: monthlyPrices }
        : undefined,
    },
    include: { monthlyPrices: true },
  });
  emitToOwner(req.userId, 'house:created', withPhotos(house));
  emitPublic('house:created', withPhotos(house));
  res.status(201).json(withPhotos(house));
}

export async function updateHouse(req, res) {
  const { id } = req.params;
  const existing = await prisma.house.findFirst({ where: { id, ownerId: req.userId } });
  if (!existing) return res.status(404).json({ error: 'Propriété introuvable' });

  const result = houseSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const { monthlyPrices, photos, amenities, ...houseData } = result.data;
  const photosArr = photos ?? (houseData.photoUrl ? [houseData.photoUrl] : undefined);

  await prisma.$transaction(async tx => {
    await tx.house.update({
      where: { id },
      data: {
        ...houseData,
        ...(photosArr !== undefined ? {
          photos: serialize(photosArr),
          photoUrl: photosArr[0] ?? null,
        } : {}),
        ...(amenities !== undefined ? { amenities: serialize(amenities) } : {}),
      },
    });

    if (monthlyPrices !== undefined) {
      await tx.houseMonthlyPrice.deleteMany({ where: { houseId: id } });
      if (monthlyPrices.length > 0) {
        await tx.houseMonthlyPrice.createMany({
          data: monthlyPrices.map(mp => ({ ...mp, houseId: id })),
        });
      }
    }
  });

  const house = await prisma.house.findUnique({
    where: { id },
    include: { monthlyPrices: { orderBy: { month: 'asc' } } },
  });
  emitToOwner(req.userId, 'house:updated', withPhotos(house));
  emitPublic('house:updated', withPhotos(house));
  res.json(withPhotos(house));
}

export async function deleteHouse(req, res) {
  const { id } = req.params;
  const existing = await prisma.house.findFirst({ where: { id, ownerId: req.userId } });
  if (!existing) return res.status(404).json({ error: 'Propriété introuvable' });

  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { houseId: id } }),
    prisma.houseMonthlyPrice.deleteMany({ where: { houseId: id } }),
    prisma.house.delete({ where: { id } }),
  ]);
  emitToOwner(req.userId, 'house:deleted', { id });
  emitPublic('house:deleted', { id });
  res.json({ message: 'Propriété supprimée' });
}

// Returns the effective price for a given house on a given month (1-12)
export async function getPriceForMonth(houseId, month) {
  const override = await prisma.houseMonthlyPrice.findUnique({
    where: { houseId_month: { houseId, month } },
  });
  if (override) return override.price;
  const house = await prisma.house.findUnique({ where: { id: houseId }, select: { pricePerNight: true } });
  return house?.pricePerNight ?? 0;
}
