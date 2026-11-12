import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { repository } from "@/lib/repositories";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";

export const alt = "Lowongan di PT Erdes Desa Maju Bersama";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Brand kit values (app/globals.css). ImageResponse cannot read CSS variables. */
const TERRACOTTA = "#b3441d";
const WHITE = "#ffffff";
const MARIGOLD_LIGHT = "#ffd98a";

/* The logo symbol on a white tile: the same crop as `.logo-tile`, at twice the size. */
const logoSrc = `data:image/png;base64,${await readFile(join(process.cwd(), "public/logo.png"), "base64")}`;

/**
 * Link preview shown when a vacancy is shared on WhatsApp and other apps.
 * Follows the kit's title slide: terracotta ground, logo tile at the top left,
 * a two-part headline with the second half in light marigold, a footer line.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await repository.getVacancyBySlug((await params).slug);
  const title = vacancy && vacancy.status === "open" ? vacancy.title : "Karier PT Erdes Desa Maju Bersama";
  const meta = vacancy
    ? [vacancy.department, vacancy.location, EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]]
    : ["Lowongan terbuka"];
  const headline = title.length > 24 ? 62 : 84;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: TERRACOTTA,
          padding: "60px 78px",
          color: WHITE,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 30 }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 112,
              height: 80,
              borderRadius: 20,
              overflow: "hidden",
              background: WHITE,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt=""
              width={157}
              height={116}
              style={{ position: "absolute", left: -22, top: 4 }}
            />
          </div>
          <div style={{ display: "flex", fontWeight: 600 }}>Karier PT Erdes Desa Maju Bersama</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: headline,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.025em",
          }}
        >
          <div style={{ display: "flex" }}>Kami sedang mencari</div>
          <div style={{ display: "flex", color: MARIGOLD_LIGHT }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40, fontSize: 28 }}>
          <div style={{ display: "flex", gap: 40 }}>
            {meta.map((item) => (
              <div key={item} style={{ display: "flex" }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontWeight: 700 }}>Lamar sekarang</div>
        </div>
      </div>
    ),
    size,
  );
}
