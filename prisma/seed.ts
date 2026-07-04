import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, RoleAdmin } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("🌱 Seeding database...");

  // === Kementerian ===
  const kemSDM = await prisma.kementerian.upsert({
    where: { kodeUnik: "01" },
    update: {},
    create: {
      nama: "SDM",
      kodeUnik: "01",
    },
  });

  const kemPendidikan = await prisma.kementerian.upsert({
    where: { kodeUnik: "02" },
    update: {},
    create: {
      nama: "Pendidikan",
      kodeUnik: "02",
    },
  });

  const kemPorpar = await prisma.kementerian.upsert({
    where: { kodeUnik: "03" },
    update: {},
    create: {
      nama: "Kemenporpar/Olahraga & Pariwisata",
      kodeUnik: "03",
    },
  });

  console.log("✅ Kementerian seeded:", kemSDM.nama, kemPendidikan.nama, kemPorpar.nama);

  // === Admin Users ===
  const passwordHash = await bcrypt.hash("admin123", 10);

  const adminSDM = await prisma.adminUser.upsert({
    where: { email: "sdm@mudajuara.id" },
    update: {},
    create: {
      nama: "Admin SDM",
      email: "sdm@mudajuara.id",
      passwordHash,
      role: RoleAdmin.SDM,
    },
  });

  const adminMenkeu = await prisma.adminUser.upsert({
    where: { email: "menkeu@mudajuara.id" },
    update: {},
    create: {
      nama: "Bendahara Umum",
      email: "menkeu@mudajuara.id",
      passwordHash,
      role: RoleAdmin.MENKEU,
    },
  });

  const adminKemen = await prisma.adminUser.upsert({
    where: { email: "pendidikan@mudajuara.id" },
    update: {},
    create: {
      nama: "Admin Pendidikan",
      email: "pendidikan@mudajuara.id",
      passwordHash,
      role: RoleAdmin.KEMENTERIAN,
      kementerianId: kemPendidikan.id,
    },
  });

  console.log("✅ Admin users seeded:", adminSDM.email, adminMenkeu.email, adminKemen.email);

  // === Sample Events ===
  const eventRahma = await prisma.event.upsert({
    where: { slug: "rahma-2026" },
    update: {},
    create: {
      kementerianId: kemSDM.id,
      nama: "Buka Bersama / RAHMA 2026",
      slug: "rahma-2026",
      deskripsi: "Buka bersama tahunan Muda Juara",
      tanggalMulai: new Date("2026-03-15"),
      tanggalSelesai: new Date("2026-03-15"),
      lokasi: "Masjid Al-Ikhlas, Bandung",
      tipeAudiens: "KEDUANYA",
      isBerbayar: true,
      kodeProgram: "21",
      isActive: true,
    },
  });

  // Harga tier for RAHMA
  await prisma.hargaTier.createMany({
    data: [
      {
        eventId: eventRahma.id,
        kategori: "Dewasa",
        harga: 50000,
        usiaMin: 13,
        usiaMax: null,
        urutan: 1,
      },
      {
        eventId: eventRahma.id,
        kategori: "Anak 6-12 tahun",
        harga: 30000,
        usiaMin: 6,
        usiaMax: 12,
        urutan: 2,
      },
      {
        eventId: eventRahma.id,
        kategori: "Balita 3-5 tahun",
        harga: 15000,
        usiaMin: 3,
        usiaMax: 5,
        urutan: 3,
      },
      {
        eventId: eventRahma.id,
        kategori: "Balita < 3 tahun",
        harga: 0,
        usiaMin: 0,
        usiaMax: 2,
        urutan: 4,
      },
    ],
    skipDuplicates: true,
  });

  const eventNgopi = await prisma.event.upsert({
    where: { slug: "ngopi-bisnis-juli-2026" },
    update: {},
    create: {
      kementerianId: kemPendidikan.id,
      nama: "Ngopi Bisnis - Juli 2026",
      slug: "ngopi-bisnis-juli-2026",
      deskripsi: "Sharing bisnis bulanan",
      tanggalMulai: new Date("2026-07-20"),
      tanggalSelesai: new Date("2026-07-20"),
      lokasi: "Kafe Nalar, Jakarta",
      tipeAudiens: "MEMBER_ONLY",
      isBerbayar: false,
      kodeProgram: "",
      isActive: true,
    },
  });

  const eventMabit = await prisma.event.upsert({
    where: { slug: "mabit-juara-2026" },
    update: {},
    create: {
      kementerianId: kemPorpar.id,
      nama: "Mabit Juara 2026",
      slug: "mabit-juara-2026",
      deskripsi: "Camping keluarga tahunan",
      tanggalMulai: new Date("2026-08-15"),
      tanggalSelesai: new Date("2026-08-17"),
      lokasi: "Bumi Perkemahan Cibodas",
      tipeAudiens: "KEDUANYA",
      isBerbayar: true,
      kodeProgram: "31",
      isActive: true,
    },
  });

  // Harga tier for Mabit (different structure from RAHMA)
  await prisma.hargaTier.createMany({
    data: [
      {
        eventId: eventMabit.id,
        kategori: "Dewasa",
        harga: 150000,
        usiaMin: 13,
        usiaMax: null,
        urutan: 1,
      },
      {
        eventId: eventMabit.id,
        kategori: "Anak",
        harga: 75000,
        usiaMin: 3,
        usiaMax: 12,
        urutan: 2,
      },
      {
        eventId: eventMabit.id,
        kategori: "Sewa Tenda",
        harga: 100000,
        usiaMin: null,
        usiaMax: null,
        urutan: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Events seeded:", eventRahma.nama, eventNgopi.nama, eventMabit.nama);

  // === Sample Members ===
  const member1 = await prisma.member.upsert({
    where: { noWa: "6281234567890" },
    update: {},
    create: {
      nama: "Ahmad Fauzi",
      noWa: "6281234567890",
      domisili: "Bandung",
      email: "ahmad@example.com",
      angkatanMj: "1",
      statusKeanggotaan: "MEMBER",
    },
  });

  // Add tanggungan
  await prisma.tanggungan.createMany({
    data: [
      {
        memberId: member1.id,
        nama: "Siti Fatimah",
        tanggalLahir: new Date("1992-05-15"),
        hubungan: "PASANGAN",
      },
      {
        memberId: member1.id,
        nama: "Aisyah Fauzi",
        tanggalLahir: new Date("2018-08-20"),
        hubungan: "ANAK",
      },
      {
        memberId: member1.id,
        nama: "Umar Fauzi",
        tanggalLahir: new Date("2021-03-10"),
        hubungan: "ANAK",
      },
    ],
    skipDuplicates: true,
  });

  const member2 = await prisma.member.upsert({
    where: { noWa: "6289876543210" },
    update: {},
    create: {
      nama: "Budi Santoso",
      noWa: "6289876543210",
      domisili: "Jakarta",
      statusKeanggotaan: "UMUM",
    },
  });

  console.log("✅ Members seeded:", member1.nama, member2.nama);

  // === Bendahara Assignment ===
  const bendahara = await prisma.adminUser.upsert({
    where: { email: "bendahara-rahma@mudajuara.id" },
    update: {},
    create: {
      nama: "Bendahara RAHMA",
      email: "bendahara-rahma@mudajuara.id",
      passwordHash,
      role: RoleAdmin.BENDAHARA,
    },
  });

  await prisma.bendaharaAssignment.upsert({
    where: {
      eventId_adminUserId: {
        eventId: eventRahma.id,
        adminUserId: bendahara.id,
      },
    },
    update: {},
    create: {
      eventId: eventRahma.id,
      adminUserId: bendahara.id,
    },
  });

  console.log("✅ Bendahara assigned to RAHMA");

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials (dev only):");
  console.log("   SDM:        sdm@mudajuara.id / admin123");
  console.log("   Menkeu:     menkeu@mudajuara.id / admin123");
  console.log("   Pendidikan: pendidikan@mudajuara.id / admin123");
  console.log("   Bendahara:  bendahara-rahma@mudajuara.id / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
