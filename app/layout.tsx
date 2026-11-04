import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Karier Erdes Group", description: "Portal rekrutmen Erdes Group" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
