/**
 * Baca variabel lingkungan dengan fallback yang aman.
 *
 * `process.env.X ?? fallback` HANYA menangkap `undefined` — bila platform
 * deploy (mis. Vercel) menyimpan variabel sebagai string kosong `""`
 * (variabel ada tapi sengaja dikosongkan), `??` tidak menganggapnya kosong
 * dan nilai `""` itu yang dipakai apa adanya. Ini pernah membuat tautan
 * berbagi tersimpan sebagai `/s/<token>` tanpa domain sama sekali.
 *
 * Aman dipakai di server maupun browser (untuk variabel berawalan
 * NEXT_PUBLIC_ yang di-inline Next.js saat build).
 */
export function envUrl(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  return v ? v : fallback;
}
