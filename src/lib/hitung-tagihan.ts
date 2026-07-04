/**
 * Hitung Tagihan — Calculate billing breakdown for a registration
 * 
 * Matches each peserta to the appropriate HargaTier based on age.
 * Member (pendaftar) sendiri = treated as "Dewasa" (no age classification needed).
 * Tanggungan = classified by age from tanggalLahir vs event date.
 */

interface HargaTierInput {
  id: string;
  kategori: string;
  harga: number;
  usiaMin: number | null;
  usiaMax: number | null;
}

interface PesertaInput {
  isSelf: boolean;
  tanggalLahir?: Date | null;
  nama: string;
}

export interface BreakdownItem {
  kategori: string;
  hargaTierId: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  pesertaNames: string[];
}

export interface TagihanResult {
  breakdown: BreakdownItem[];
  totalTagihan: number;
}

/**
 * Calculate age in years as of a reference date
 */
function calculateAge(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Find the matching HargaTier for a given age.
 * If no age-based tier matches, fall back to the first tier (usually "Dewasa").
 */
function findMatchingTier(
  age: number | null,
  tiers: HargaTierInput[],
  isSelf: boolean
): HargaTierInput | null {
  if (tiers.length === 0) return null;

  // For self (member pendaftar) or unknown age, use the first tier
  // that has no age bounds or the first tier overall (usually "Dewasa")
  if (isSelf || age === null) {
    const adultTier = tiers.find(
      (t) => t.usiaMin === null && t.usiaMax === null
    );
    return adultTier || tiers[0];
  }

  // Find tier that matches the age range
  for (const tier of tiers) {
    const minOk = tier.usiaMin === null || age >= tier.usiaMin;
    const maxOk = tier.usiaMax === null || age <= tier.usiaMax;
    if (minOk && maxOk) return tier;
  }

  // Fallback: first tier with no bounds, or first tier period
  return tiers.find((t) => t.usiaMin === null && t.usiaMax === null) || tiers[0];
}

/**
 * Main function: calculate tagihan breakdown
 */
export function hitungTagihan(
  pesertaList: PesertaInput[],
  tiers: HargaTierInput[],
  eventDate: Date
): TagihanResult {
  if (tiers.length === 0) {
    return { breakdown: [], totalTagihan: 0 };
  }

  // Group peserta by their matched tier
  const tierMap = new Map<
    string,
    { tier: HargaTierInput; pesertaNames: string[] }
  >();

  for (const peserta of pesertaList) {
    const age =
      peserta.tanggalLahir && !peserta.isSelf
        ? calculateAge(peserta.tanggalLahir, eventDate)
        : null;

    const matchedTier = findMatchingTier(age, tiers, peserta.isSelf);
    if (!matchedTier) continue;

    const existing = tierMap.get(matchedTier.id);
    if (existing) {
      existing.pesertaNames.push(peserta.nama);
    } else {
      tierMap.set(matchedTier.id, {
        tier: matchedTier,
        pesertaNames: [peserta.nama],
      });
    }
  }

  // Build breakdown
  const breakdown: BreakdownItem[] = [];
  let totalTagihan = 0;

  for (const [, { tier, pesertaNames }] of tierMap) {
    const jumlah = pesertaNames.length;
    const subtotal = jumlah * tier.harga;
    totalTagihan += subtotal;

    breakdown.push({
      kategori: tier.kategori,
      hargaTierId: tier.id,
      jumlah,
      hargaSatuan: tier.harga,
      subtotal,
      pesertaNames,
    });
  }

  return { breakdown, totalTagihan };
}
