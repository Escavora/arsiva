import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Jangan pernah membawa data lokal, berkas scan, atau kredensial ke output
  // server — walaupun ada akses filesystem dinamis yang membuat Turbopack
  // menelusuri seluruh proyek.
  outputFileTracingExcludes: {
    "*": ["./data/**", "./storage/**", "./reference/**", "./.env*"],
  },
  experimental: {
    // Batasi worker build: dengan default (jumlah core) build kehabisan memori
    // di laptop pengembang.
    cpus: 4,
  },
};

export default nextConfig;
