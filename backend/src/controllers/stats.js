import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboard(req, res) {
  const houses = await prisma.house.findMany({
    where: { ownerId: req.userId },
    select: { id: true },
  });
  const houseIds = houses.map(h => h.id);

  const [allBookings, activeBookings, pendingBookings] = await Promise.all([
    prisma.booking.findMany({ where: { houseId: { in: houseIds } } }),
    prisma.booking.findMany({ where: { houseId: { in: houseIds }, status: 'confirmed' } }),
    prisma.booking.findMany({ where: { houseId: { in: houseIds }, status: 'pending' } }),
  ]);

  const totalRevenue = allBookings.reduce((s, b) => s + b.totalAmount, 0);
  const collected = allBookings.reduce((s, b) => s + b.amountPaid, 0);
  const pendingPayment = totalRevenue - collected;

  const now = new Date();
  const upcoming = await prisma.booking.findMany({
    where: {
      houseId: { in: houseIds },
      status: 'confirmed',
      checkIn: { gte: now },
    },
    include: { house: { select: { name: true, color: true } } },
    orderBy: { checkIn: 'asc' },
    take: 5,
  });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const recentBookings = await prisma.booking.findMany({
    where: { houseId: { in: houseIds }, checkIn: { gte: sixMonthsAgo } },
  });

  const monthlyRevenue = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[key] = 0;
  }

  recentBookings.forEach(b => {
    const d = new Date(b.checkIn);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthlyRevenue) monthlyRevenue[key] += b.totalAmount;
  });

  res.json({
    totalHouses: houses.length,
    activeBookings: activeBookings.length,
    pendingBookings: pendingBookings.length,
    totalRevenue,
    collected,
    pendingPayment,
    upcomingArrivals: upcoming,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
  });
}

export async function getIncome(req, res) {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const houses = await prisma.house.findMany({
    where: { ownerId: req.userId },
    include: {
      bookings: {
        where: {
          checkIn: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) },
        },
      },
    },
  });

  const houseIds = houses.map(h => h.id);

  const allYearBookings = await prisma.booking.findMany({
    where: {
      houseId: { in: houseIds },
      checkIn: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) },
    },
    include: { house: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: 0,
    collected: 0,
  }));

  houses.forEach(h => {
    h.bookings.forEach(b => {
      const m = new Date(b.checkIn).getMonth();
      monthly[m].revenue += b.totalAmount;
      monthly[m].collected += b.amountPaid;
    });
  });

  const houseStats = houses.map(h => ({
    id: h.id,
    name: h.name,
    color: h.color,
    totalRevenue: h.bookings.reduce((s, b) => s + b.totalAmount, 0),
    collected: h.bookings.reduce((s, b) => s + b.amountPaid, 0),
    bookingCount: h.bookings.length,
  }));

  const grandTotal = houseStats.reduce((s, h) => s + h.totalRevenue, 0);

  res.json({ monthly, houseStats, recentBookings: allYearBookings, grandTotal });
}
