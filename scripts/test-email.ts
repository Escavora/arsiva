/**
 * Uji konfigurasi email tanpa menyentuh aplikasi.
 *
 *   npm run email:test -- nama@domain.com
 *
 * Membaca EMAIL_DRIVER dan kredensial dari .env, lalu mengirim satu email uji.
 * Bila gagal, pesan errornya dicetak apa adanya supaya mudah ditelusuri.
 */
import "./load-env";
import { getMailer, emailHtml } from "../src/lib/notify";

const tujuan = process.argv[2];

function keluarDenganPetunjuk(pesan: string): never {
  console.error(`\n❌ ${pesan}\n`);
  process.exit(1);
}

async function main() {
  if (!tujuan || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tujuan)) {
    keluarDenganPetunjuk(
      'Sertakan email tujuan, contoh:\n   npm run email:test -- nama@gmail.com',
    );
  }

  const driver = process.env.EMAIL_DRIVER ?? "log";
  console.log(`→ Driver aktif : ${driver}`);
  console.log(`→ Pengirim     : ${process.env.EMAIL_FROM ?? "(EMAIL_FROM belum diisi)"}`);
  console.log(`→ Tujuan       : ${tujuan}\n`);

  if (driver === "log") {
    console.log(
      'ℹ  EMAIL_DRIVER masih "log" — email hanya dicetak ke layar, tidak benar-benar dikirim.\n' +
        '   Ubah EMAIL_DRIVER di .env menjadi "resend" atau "smtp" untuk mengirim sungguhan.\n',
    );
  }

  const judul = "Uji coba email ARSIVA";
  const paragraf = [
    "Ini adalah email uji coba dari aplikasi ARSIVA.",
    `Bila Anda menerima pesan ini, konfigurasi driver "${driver}" sudah berfungsi dengan benar.`,
  ];

  try {
    await getMailer().send({
      to: tujuan,
      subject: judul,
      text: paragraf.join("\n\n"),
      html: emailHtml(judul, paragraf),
    });
    console.log("✅ Email berhasil dikirim.");
    if (driver !== "log") {
      console.log("   Periksa kotak masuk (dan folder spam) penerima.");
    }
  } catch (err) {
    keluarDenganPetunjuk(
      `Gagal mengirim email:\n   ${err instanceof Error ? err.message : String(err)}\n\n` +
        "Periksa kembali nilai di .env:\n" +
        (driver === "resend"
          ? "   RESEND_API_KEY, EMAIL_FROM (domain harus terverifikasi di Resend,\n" +
            "   atau pakai onboarding@resend.dev untuk uji coba ke email Anda sendiri)"
          : driver === "smtp"
            ? "   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS\n" +
              "   (Gmail wajib memakai App Password, bukan kata sandi akun)"
            : "   EMAIL_DRIVER"),
    );
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
