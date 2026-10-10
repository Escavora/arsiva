/**
 * Menerjemahkan error Clerk ke pesan berbahasa Indonesia.
 *
 * Clerk mengembalikan `ClerkAPIResponseError` yang `code`-nya selalu
 * "api_response_error"; kode yang sebenarnya ada di `errors[0].code`.
 * `message`/`longMessage` berbahasa Inggris dan menurut Clerk tidak stabil,
 * jadi tidak pernah ditampilkan ke pengguna — kode yang tidak dikenal
 * jatuh ke pesan cadangan.
 *
 * Dipakai di klien (login, ubah kata sandi) dan server (`clerk-users.ts`).
 */

type GalatApi = { code?: string; message?: string; longMessage?: string };

/** "masuk" = halaman login, "sandi" = ubah kata sandi sendiri, "akun" = Admin mengelola pengguna. */
export type KonteksClerk = "masuk" | "sandi" | "akun";

function galatPertama(err: unknown): GalatApi {
  if (!err || typeof err !== "object") return {};
  const daftar = (err as { errors?: GalatApi[] }).errors;
  if (Array.isArray(daftar) && daftar.length > 0) return daftar[0];
  return err as GalatApi;
}

/** Kode error pertama dari error Clerk, bila ada. */
export function kodeClerk(err: unknown): string | undefined {
  return galatPertama(err).code;
}

const UMUM: Record<string, string> = {
  form_code_incorrect: "Kode verifikasi salah. Periksa kembali.",
  verification_failed: "Kode verifikasi salah. Periksa kembali.",
  verification_expired: "Kode verifikasi sudah kadaluarsa. Masuk ulang untuk meminta kode baru.",
  form_param_format_invalid__email_address: "Format email tidak valid.",
  form_param_type_invalid__email_address: "Format email tidak valid.",
  form_email_address_blocked: "Alamat email ini tidak diizinkan.",
  user_locked: "Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi nanti.",
  too_many_requests: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  not_allowed_access: "Akun ini tidak diizinkan masuk. Hubungi Admin.",
  session_exists: "Anda sudah masuk. Muat ulang halaman ini.",
};

const MASUK: Record<string, string> = {
  // Sengaja tidak membedakan "email tidak ada" dan "sandi salah".
  form_password_incorrect: "Email atau kata sandi salah.",
  form_password_validation_failed: "Email atau kata sandi salah.",
  form_password_or_identifier_incorrect: "Email atau kata sandi salah.",
  form_identifier_not_found: "Email atau kata sandi salah.",
  strategy_for_user_invalid: "Email atau kata sandi salah.",
  form_password_pwned__sign_in: "Kata sandi akun ini tercatat bocor di internet. Hubungi Admin untuk mengatur ulang.",
  form_password_compromised__sign_in: "Kata sandi akun ini tercatat bocor di internet. Hubungi Admin untuk mengatur ulang.",
  form_password_untrusted__sign_in: "Kata sandi akun ini perlu diatur ulang. Hubungi Admin.",
};

const SANDI: Record<string, string> = {
  form_password_incorrect: "Kata sandi saat ini salah.",
  form_password_validation_failed: "Kata sandi saat ini salah.",
  form_password_not_strong_enough: "Kata sandi baru terlalu lemah. Tambahkan huruf besar, angka, atau simbol.",
  form_password_pwned: "Kata sandi baru ini pernah bocor di internet. Pilih kata sandi lain.",
  form_password_compromised: "Kata sandi baru ini pernah bocor di internet. Pilih kata sandi lain.",
  form_new_password_matches_current: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
  form_password_matches_identifier: "Kata sandi baru tidak boleh sama dengan email.",
  form_password_size_in_bytes_exceeded: "Kata sandi baru terlalu panjang.",
};

const AKUN: Record<string, string> = {
  form_identifier_exists: "Email sudah terdaftar di Clerk.",
  form_identifier_exists__email_address: "Email sudah terdaftar di Clerk.",
  form_password_not_strong_enough: "Kata sandi terlalu lemah. Tambahkan huruf besar, angka, atau simbol.",
  form_password_pwned: "Kata sandi ini pernah bocor di internet. Pilih kata sandi lain.",
  form_password_compromised: "Kata sandi ini pernah bocor di internet. Pilih kata sandi lain.",
  form_password_matches_identifier: "Kata sandi tidak boleh sama dengan email.",
  form_password_size_in_bytes_exceeded: "Kata sandi terlalu panjang.",
};

const PETA: Record<KonteksClerk, Record<string, string>> = { masuk: MASUK, sandi: SANDI, akun: AKUN };

const CADANGAN: Record<KonteksClerk, string> = {
  masuk: "Gagal masuk. Coba lagi.",
  sandi: "Gagal mengubah kata sandi. Coba lagi.",
  akun: "Gagal memproses akun di Clerk.",
};

export function pesanClerk(err: unknown, konteks: KonteksClerk, cadangan = CADANGAN[konteks]): string {
  const { code, longMessage, message } = galatPertama(err);

  if (code === "form_password_length_too_short") {
    // Batas minimum diatur di dashboard Clerk; angkanya hanya ada di teks pesannya.
    const subjek = konteks === "sandi" ? "Kata sandi baru" : "Kata sandi";
    const min = (longMessage ?? message ?? "").match(/\d+/)?.[0];
    return min ? `${subjek} minimal ${min} karakter.` : `${subjek} terlalu pendek.`;
  }

  return (code && (PETA[konteks][code] ?? UMUM[code])) || cadangan;
}
