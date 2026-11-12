import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/** Brand kit faces: Bricolage Grotesque for headings, Plus Jakarta Sans for everything else. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-bricolage",
  display: "swap",
});

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "Karier PT Erdes Desa Maju Bersama", template: "%s · Karier PT Erdes Desa Maju Bersama" },
  description: "Portal rekrutmen PT Erdes Desa Maju Bersama",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakarta.variable} ${bricolage.variable}`}>
      <body>{children}</body>
    </html>
  );
}
