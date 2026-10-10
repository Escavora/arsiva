/**
 * Pembuat frasa sandi acak untuk akun demo: 5 kata + 2 angka, mis. "kopi-jendela-arsip-hujan-pena-72".
 * Diacak dengan crypto.randomInt (bukan Math.random). Hasilnya hanya dicetak ke terminal,
 * tidak pernah ditulis ke berkas.
 */
import { randomInt } from "node:crypto";

const KATA = [
  "arsip", "pena", "kopi", "hujan", "jendela", "meja", "lampu", "sungai", "gunung", "pantai",
  "kertas", "map", "rak", "kunci", "pintu", "jalan", "kebun", "bunga", "daun", "akar",
  "batu", "pasir", "awan", "angin", "bulan", "bintang", "pagi", "senja", "malam", "embun",
  "kapal", "layar", "dermaga", "pulau", "teluk", "ombak", "karang", "nelayan", "jaring", "perahu",
  "sepeda", "kereta", "stasiun", "peron", "tiket", "koper", "peta", "kompas", "jembatan", "terowongan",
  "nangka", "durian", "mangga", "pisang", "kelapa", "jambu", "salak", "rambutan", "manggis", "duku",
  "rendang", "sate", "gulai", "soto", "bakso", "lemang", "dodol", "kerupuk", "sambal", "lontong",
  "gitar", "suling", "gendang", "kecapi", "angklung", "lagu", "irama", "nada", "panggung", "tirai",
  "buku", "sampul", "halaman", "tinta", "stempel", "amplop", "surat", "perangko", "kalender", "jam",
  "elang", "merpati", "kancil", "harimau", "gajah", "penyu", "rusa", "kelinci", "tupai", "bangau",
  "hutan", "lembah", "bukit", "danau", "sawah", "ladang", "padang", "rawa", "muara", "tanjung",
  "merah", "jingga", "kuning", "hijau", "biru", "ungu", "perak", "emas", "tembaga", "kristal",
  "atap", "tangga", "lantai", "dinding", "teras", "pagar", "gerbang", "menara", "kubah", "serambi",
];

export function frasaSandi(jumlahKata = 5): string {
  const kata = Array.from({ length: jumlahKata }, () => KATA[randomInt(KATA.length)]);
  return [...kata, String(randomInt(10, 100))].join("-");
}
