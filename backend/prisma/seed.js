import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  const [ahmed, sonia] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Ahmed Ben Ali',
        email: 'ahmed@example.com',
        password: await bcrypt.hash('demo123', 10),
        language: 'fr',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sonia Trabelsi',
        email: 'sonia@example.com',
        password: await bcrypt.hash('demo123', 10),
        language: 'fr',
      },
    }),
  ]);

  const [villa, appart, dar] = await Promise.all([
    prisma.house.create({
      data: {
        name: 'Villa Carthage',
        location: 'Hammamet',
        bedrooms: 4,
        pricePerNight: 250,
        color: '#1A3C5E',
        ownerId: ahmed.id,
      },
    }),
    prisma.house.create({
      data: {
        name: 'Appartement Sidi Bou',
        location: 'Sidi Bou Said',
        bedrooms: 2,
        pricePerNight: 150,
        color: '#C96A3B',
        ownerId: ahmed.id,
      },
    }),
    prisma.house.create({
      data: {
        name: 'Dar Yasmine',
        location: 'Sousse',
        bedrooms: 3,
        pricePerNight: 180,
        color: '#2D7D46',
        ownerId: sonia.id,
      },
    }),
  ]);

  const now = new Date();
  const y = now.getFullYear();

  await prisma.booking.createMany({
    data: [
      {
        guestName: 'Karim Mansouri',
        phone: '+216 55 123 456',
        checkIn: new Date(y, 5, 10),
        checkOut: new Date(y, 5, 17),
        totalAmount: 1750,
        amountPaid: 1750,
        status: 'confirmed',
        notes: 'Famille de 6 personnes',
        houseId: villa.id,
      },
      {
        guestName: 'Leila Chaouachi',
        phone: '+216 98 765 432',
        checkIn: new Date(y, 6, 1),
        checkOut: new Date(y, 6, 8),
        totalAmount: 1050,
        amountPaid: 500,
        status: 'confirmed',
        houseId: appart.id,
      },
      {
        guestName: 'Mohamed Ferjani',
        phone: '+216 20 111 222',
        checkIn: new Date(y, 6, 15),
        checkOut: new Date(y, 6, 22),
        totalAmount: 1750,
        amountPaid: 0,
        status: 'pending',
        notes: 'En attente de confirmation du virement',
        houseId: villa.id,
      },
      {
        guestName: 'Amira Belhadj',
        phone: '+216 23 333 444',
        checkIn: new Date(y, 7, 5),
        checkOut: new Date(y, 7, 12),
        totalAmount: 1260,
        amountPaid: 1260,
        status: 'confirmed',
        houseId: dar.id,
      },
      {
        guestName: 'Nabil Sassi',
        phone: '+216 55 555 666',
        checkIn: new Date(y, 5, 20),
        checkOut: new Date(y, 5, 25),
        totalAmount: 750,
        amountPaid: 750,
        status: 'cancelled',
        notes: 'Annulé par le client',
        houseId: appart.id,
      },
      {
        guestName: 'Rim Khelifi',
        phone: '+216 99 888 777',
        checkIn: new Date(y, 8, 1),
        checkOut: new Date(y, 8, 10),
        totalAmount: 2250,
        amountPaid: 1000,
        status: 'pending',
        houseId: villa.id,
      },
    ],
  });

  console.log('✅ Base de données peuplée avec succès');
  console.log('   ahmed@example.com / demo123');
  console.log('   sonia@example.com / demo123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
