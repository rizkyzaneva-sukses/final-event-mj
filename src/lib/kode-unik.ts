/**
 * Kode Unik Generator
 * 
 * Pola: kode Kementerian (2+ digit) + kode Program (2+ digit)
 * Contoh: SDM=01, Program RAHMA=21 → "0121"
 * 
 * Kode ini SAMA untuk semua peserta di satu event.
 * Pencocokan ke peserta = kode unik + nominal tagihan persis.
 */

export function generateKodeUnik(
  kodeKementerian: string,
  kodeProgram: string
): string {
  // Pad to ensure minimum 2 digits each
  const kemen = kodeKementerian.padStart(2, "0");
  const program = kodeProgram.padStart(2, "0");
  return `${kemen}${program}`;
}

/**
 * Format nominal as transfer amount display
 * e.g., 150000 → "Rp 150.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}
