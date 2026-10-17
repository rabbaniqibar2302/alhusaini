import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * File adzan diunggah langsung dari browser admin ke API Vercel Blob
 * (https://vercel.com/api/blob), lalu diputar dari domain publik Blob.
 * NEXT_PUBLIC_VERCEL_BLOB_API_URL hanya dipakai untuk emulator lokal.
 */
const apiBlob = process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL
  ? new URL(process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL).origin
  : "https://vercel.com";

/**
 * Content-Security-Policy statis (tanpa nonce).
 *
 * Nonce tidak bisa dipakai bersama Partial Prerendering / Cache Components
 * karena halaman disajikan dari cache statis. Karena itu `script-src` masih
 * membutuhkan 'unsafe-inline' untuk skrip hidrasi inline milik Next.js.
 * Perlindungan XSS utama tetap: React meng-escape semua output, tidak ada
 * dangerouslySetInnerHTML, dan seluruh input divalidasi dengan zod.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  `connect-src 'self' ${apiBlob}${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Foto yang diunggah admin disimpan di Vercel Blob (store publik).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/masjid/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      // Foto maksimal 5 MB + overhead multipart.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
