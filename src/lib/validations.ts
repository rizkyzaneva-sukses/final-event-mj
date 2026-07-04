import { z } from "zod";

// === Phone number normalization ===
// Accept: 08xxx, 628xxx, +628xxx — normalize to 628xxx
export function normalizeNoWa(raw: string): string {
  let cleaned = raw.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  return cleaned;
}

const noWaSchema = z
  .string()
  .min(8, "No. WA minimal 8 digit")
  .max(20, "No. WA terlalu panjang")
  .transform(normalizeNoWa);

// === Member ===
export const memberLookupSchema = z.object({
  noWa: noWaSchema,
});

export const memberCreateSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  noWa: noWaSchema,
  domisili: z.string().max(100).default(""),
  email: z.string().email("Email tidak valid").max(100).optional().or(z.literal("")),
  angkatanMj: z.string().max(20).optional().or(z.literal("")),
  statusKeanggotaan: z.enum(["MEMBER", "UMUM"]).default("UMUM"),
});

export const memberUpdateSchema = memberCreateSchema.partial();

// === Tanggungan ===
export const tanggunganCreateSchema = z.object({
  nama: z.string().min(1, "Nama tanggungan wajib diisi").max(100),
  tanggalLahir: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  hubungan: z.enum(["PASANGAN", "ANAK", "LAINNYA"]),
});

export const tanggunganUpdateSchema = tanggunganCreateSchema.partial();

// === Kementerian ===
export const kementerianSchema = z.object({
  nama: z.string().min(1, "Nama kementerian wajib diisi").max(100),
  kodeUnik: z
    .string()
    .min(1, "Kode unik wajib diisi")
    .max(4, "Kode unik maksimal 4 karakter"),
});

// === Event ===
export const eventCreateSchema = z.object({
  kementerianId: z.string().uuid(),
  nama: z.string().min(1, "Nama event wajib diisi").max(200),
  slug: z
    .string()
    .min(1, "Slug wajib diisi")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung"),
  deskripsi: z.string().optional(),
  tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  tanggalSelesai: z.string().min(1, "Tanggal selesai wajib diisi"),
  lokasi: z.string().max(200).default(""),
  tipeAudiens: z.enum(["MEMBER_ONLY", "UMUM", "KEDUANYA"]).default("KEDUANYA"),
  isBerbayar: z.boolean().default(false),
  kodeProgram: z.string().max(4).default(""),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// === HargaTier ===
export const hargaTierSchema = z.object({
  kategori: z.string().min(1, "Kategori wajib diisi").max(50),
  harga: z.number().int().min(0, "Harga tidak boleh negatif"),
  usiaMin: z.number().int().min(0).optional().nullable(),
  usiaMax: z.number().int().min(0).optional().nullable(),
  urutan: z.number().int().default(0),
});

// === Registrasi (Public) ===
export const registrasiCreateSchema = z.object({
  noWa: noWaSchema,
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  domisili: z.string().max(100).default(""),
  email: z.string().email().max(100).optional().or(z.literal("")),
  angkatanMj: z.string().max(20).optional().or(z.literal("")),
  statusOts: z.boolean().default(false),
  // Participant selection
  includeSelf: z.boolean().default(true),
  tanggunganIds: z.array(z.string().uuid()).default([]),
  // New tanggungan to add during registration
  newTanggungan: z
    .array(
      z.object({
        nama: z.string().min(1).max(100),
        tanggalLahir: z.string().optional(),
        hubungan: z.enum(["PASANGAN", "ANAK", "LAINNYA"]),
      })
    )
    .default([]),
});

// === Pembayaran ===
export const pembayaranUploadSchema = z.object({
  registrasiId: z.string().uuid(),
  buktiTransferUrl: z.string().url().optional(),
  noReferensi: z.string().max(50).optional(),
});

export const pembayaranVerifySchema = z.object({
  status: z.enum(["BELUM_BAYAR", "BELUM_DIVERIFIKASI", "TERVERIFIKASI"]),
});

// === AdminUser ===
export const adminUserCreateSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Email tidak valid").max(100),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["SDM", "MENKEU", "KEMENTERIAN", "BENDAHARA"]),
  kementerianId: z.string().uuid().optional().nullable(),
});

export const adminUserUpdateSchema = adminUserCreateSchema
  .partial()
  .omit({ password: true })
  .extend({
    password: z.string().min(6).optional(),
  });

// === Login ===
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
