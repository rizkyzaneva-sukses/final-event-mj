import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrasiCreateSchema, normalizeNoWa } from "@/lib/validations";
import { hitungTagihan } from "@/lib/hitung-tagihan";
import { generateKodeUnik } from "@/lib/kode-unik";

/**
 * POST: Public registration endpoint
 * 
 * Flow:
 * 1. Find or create member by noWa
 * 2. Create any new tanggungan
 * 3. Create registrasi + registrasiPeserta records
 * 4. If event is berbayar, calculate tagihan and create pembayaran
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registrasiCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventSlug = searchParams.get("eventSlug");

    if (!eventSlug) {
      return NextResponse.json(
        { error: "Event slug wajib disertakan" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 1. Find the event
    const event = await prisma.event.findUnique({
      where: { slug: eventSlug },
      include: {
        kementerian: true,
        hargaTier: { orderBy: { urutan: "asc" } },
      },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { error: "Event tidak ditemukan atau sudah ditutup" },
        { status: 404 }
      );
    }

    // 2. Find or create member
    const noWa = normalizeNoWa(data.noWa);
    let member = await prisma.member.findUnique({
      where: { noWa },
      include: { tanggungan: true },
    });

    let isNewMember = false;

    if (!member) {
      member = await prisma.member.create({
        data: {
          nama: data.nama,
          noWa,
          domisili: data.domisili || "",
          email: data.email || null,
          angkatanMj: data.angkatanMj || null,
          statusKeanggotaan: "UMUM",
        },
        include: { tanggungan: true },
      });
      isNewMember = true;
    } else {
      // Update member data if provided (auto-update profile)
      await prisma.member.update({
        where: { id: member.id },
        data: {
          nama: data.nama || member.nama,
          domisili: data.domisili || member.domisili,
          email: data.email || member.email,
          angkatanMj: data.angkatanMj || member.angkatanMj,
        },
      });
    }

    // Check duplicate registration
    const existingReg = await prisma.registrasi.findUnique({
      where: {
        eventId_memberId: {
          eventId: event.id,
          memberId: member.id,
        },
      },
    });

    if (existingReg) {
      return NextResponse.json(
        { error: "Anda sudah terdaftar di event ini" },
        { status: 409 }
      );
    }

    // 3. Create new tanggungan if any
    const newTanggunganIds: string[] = [];
    if (data.newTanggungan && data.newTanggungan.length > 0) {
      for (const t of data.newTanggungan) {
        const created = await prisma.tanggungan.create({
          data: {
            memberId: member.id,
            nama: t.nama,
            tanggalLahir: t.tanggalLahir ? new Date(t.tanggalLahir) : null,
            hubungan: t.hubungan,
          },
        });
        newTanggunganIds.push(created.id);
      }
    }

    // Combine selected tanggungan IDs
    const allTanggunganIds = [...data.tanggunganIds, ...newTanggunganIds];

    // 4. Create registrasi
    const registrasi = await prisma.registrasi.create({
      data: {
        eventId: event.id,
        memberId: member.id,
        statusOts: data.statusOts,
      },
    });

    // 5. Create registrasiPeserta records
    const pesertaData = [];

    // Self registration
    if (data.includeSelf) {
      pesertaData.push({
        registrasiId: registrasi.id,
        memberId: member.id,
        tanggunganId: null,
      });
    }

    // Tanggungan
    for (const tanggunganId of allTanggunganIds) {
      pesertaData.push({
        registrasiId: registrasi.id,
        memberId: null,
        tanggunganId,
      });
    }

    await prisma.registrasiPeserta.createMany({ data: pesertaData });

    // 6. If berbayar, calculate tagihan
    let pembayaran = null;
    let breakdown: { kategori: string; jumlah: number; hargaSatuan: number; subtotal: number }[] = [];

    if (event.isBerbayar && event.hargaTier.length > 0) {
      // Fetch tanggungan data for age calculation
      const tanggunganData = allTanggunganIds.length > 0
        ? await prisma.tanggungan.findMany({
            where: { id: { in: allTanggunganIds } },
          })
        : [];

      // Build peserta list for billing
      const pesertaList = [];

      if (data.includeSelf) {
        pesertaList.push({
          isSelf: true,
          tanggalLahir: null,
          nama: member.nama,
        });
      }

      for (const t of tanggunganData) {
        pesertaList.push({
          isSelf: false,
          tanggalLahir: t.tanggalLahir,
          nama: t.nama,
        });
      }

      const result = hitungTagihan(
        pesertaList,
        event.hargaTier,
        event.tanggalMulai
      );

      breakdown = result.breakdown.map((b) => ({
        kategori: b.kategori,
        jumlah: b.jumlah,
        hargaSatuan: b.hargaSatuan,
        subtotal: b.subtotal,
      }));

      // Generate kode unik
      const kodeUnik = generateKodeUnik(
        event.kementerian.kodeUnik,
        event.kodeProgram
      );

      pembayaran = await prisma.pembayaran.create({
        data: {
          registrasiId: registrasi.id,
          jumlahTagihan: result.totalTagihan,
          kodeUnik,
          status: "BELUM_BAYAR",
        },
      });
    }

    return NextResponse.json({
      registrasi: {
        id: registrasi.id,
        eventId: registrasi.eventId,
        createdAt: registrasi.createdAt,
      },
      member: {
        id: member.id,
        nama: member.nama,
        noWa: member.noWa,
      },
      isNewMember,
      pembayaran: pembayaran
        ? {
            id: pembayaran.id,
            jumlahTagihan: pembayaran.jumlahTagihan,
            kodeUnik: pembayaran.kodeUnik,
            status: pembayaran.status,
          }
        : null,
      breakdown,
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
