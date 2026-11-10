import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["googleapis", "bcryptjs"],
  // The applicant PDF reads its font files at runtime; make sure they ship with the route.
  outputFileTracingIncludes: {
    "/admin/pelamar/*/pdf": ["./node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-*-normal.woff"],
  },
  async headers() {
    const sensitiveHeaders = [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "private, no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ];
    return [
      { source: "/:path*", headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ] },
      { source: "/lacak/:path*", headers: sensitiveHeaders },
      { source: "/lamaran/berhasil/:path*", headers: sensitiveHeaders },
      { source: "/admin/:path*", headers: sensitiveHeaders },
    ];
  },
};

export default nextConfig;
