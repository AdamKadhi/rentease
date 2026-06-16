import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emitToOwner } from '../socket.js';

const prisma = new PrismaClient();

const bookingSchema = z.object({
  guestName: z.string().min(1),
  phone: z.string().min(1),
  checkIn: z.string().transform(s => new Date(s)),
  checkOut: z.string().transform(s => new Date(s)),
  totalAmount: z.number().positive(),
  amountPaid: z.number().min(0).default(0),
  status: z.enum(['confirmed', 'pending', 'cancelled']).default('confirmed'),
  notes: z.string().optional(),
  persons: z.number().int().positive().optional().nullable(),
  houseId: z.string().min(1),
});

// Returns the first active booking that overlaps [checkIn, checkOut), excluding a given id
async function findOverlap(houseId, checkIn, checkOut, excludeId = null) {
  return prisma.booking.findFirst({
    where: {
      houseId,
      status: { in: ['confirmed', 'pending'] },
      ...(excludeId && { id: { not: excludeId } }),
      // Overlap condition: existing starts before new ends AND existing ends after new starts
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    select: {
      id: true,
      guestName: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
  });
}

export async function getBookings(req, res) {
  const { houseId, status } = req.query;

  const houses = await prisma.house.findMany({
    where: { ownerId: req.userId },
    select: { id: true },
  });
  const houseIds = houses.map(h => h.id);

  const where = {
    houseId: { in: houseIds },
    ...(houseId && { houseId }),
    ...(status && { status }),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: { house: { select: { id: true, name: true, location: true, color: true, photoUrl: true, pricePerNight: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(bookings);
}

export async function checkAvailability(req, res) {
  const { houseId, checkIn, checkOut, excludeId } = req.query;
  if (!houseId || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  // Verify the house belongs to the user
  const house = await prisma.house.findFirst({ where: { id: houseId, ownerId: req.userId } });
  if (!house) return res.status(403).json({ error: 'Non autorisé' });

  const conflict = await findOverlap(houseId, new Date(checkIn), new Date(checkOut), excludeId);
  res.json({ available: !conflict, conflict: conflict || null });
}

export async function getCalendar(req, res) {
  const { month, year } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const houses = await prisma.house.findMany({
    where: { ownerId: req.userId },
    select: { id: true },
  });
  const houseIds = houses.map(h => h.id);

  const bookings = await prisma.booking.findMany({
    where: {
      houseId: { in: houseIds },
      status: { not: 'cancelled' },
      OR: [
        { checkIn: { gte: start, lte: end } },
        { checkOut: { gte: start, lte: end } },
        { AND: [{ checkIn: { lte: start } }, { checkOut: { gte: end } }] },
      ],
    },
    include: { house: { select: { id: true, name: true, location: true, color: true, photoUrl: true } } },
  });
  res.json(bookings);
}

export async function createBooking(req, res) {
  const result = bookingSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  const house = await prisma.house.findFirst({
    where: { id: result.data.houseId, ownerId: req.userId },
  });
  if (!house) return res.status(403).json({ error: 'Propriété non autorisée' });

  // Only block overlaps for non-cancelled bookings
  if (result.data.status !== 'cancelled') {
    const conflict = await findOverlap(result.data.houseId, result.data.checkIn, result.data.checkOut);
    if (conflict) {
      return res.status(409).json({
        error: `Cette propriété est déjà réservée du ${fmt(conflict.checkIn)} au ${fmt(conflict.checkOut)} (${conflict.guestName})`,
        conflict,
      });
    }
  }

  const booking = await prisma.booking.create({
    data: result.data,
    include: { house: { select: { id: true, name: true, location: true, color: true, photoUrl: true } } },
  });
  emitToOwner(req.userId, 'booking:created', booking);
  res.status(201).json(booking);
}

export async function updateBooking(req, res) {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { house: true } });
  if (!booking || booking.house.ownerId !== req.userId) {
    return res.status(404).json({ error: 'Réservation introuvable' });
  }

  const result = bookingSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0].message });

  // Check overlap only if dates or house changed and status won't be cancelled
  const newStatus = result.data.status ?? booking.status;
  const newHouseId = result.data.houseId ?? booking.houseId;
  const newCheckIn = result.data.checkIn ?? booking.checkIn;
  const newCheckOut = result.data.checkOut ?? booking.checkOut;

  if (newStatus !== 'cancelled') {
    const conflict = await findOverlap(newHouseId, newCheckIn, newCheckOut, id);
    if (conflict) {
      return res.status(409).json({
        error: `Cette propriété est déjà réservée du ${fmt(conflict.checkIn)} au ${fmt(conflict.checkOut)} (${conflict.guestName})`,
        conflict,
      });
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: result.data,
    include: { house: { select: { id: true, name: true, location: true, color: true, photoUrl: true } } },
  });
  emitToOwner(req.userId, 'booking:updated', updated);
  res.json(updated);
}

export async function deleteBooking(req, res) {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { house: true } });
  if (!booking || booking.house.ownerId !== req.userId) {
    return res.status(404).json({ error: 'Réservation introuvable' });
  }

  await prisma.booking.delete({ where: { id } });
  emitToOwner(req.userId, 'booking:deleted', { id });
  res.json({ message: 'Réservation supprimée' });
}

function fmt(date) {
  return new Date(date).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
