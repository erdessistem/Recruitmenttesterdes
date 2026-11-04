import { ImageResponse } from "next/og";
import { repository } from "@/lib/repositories";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";

export const alt = "Lowongan di Erdes Group";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#18222d";
const MUTED = "#5b6673";
const REL = "#0f6e56";
const SINYAL = "#ef9f27";

/** Link preview shown when a vacancy is shared on WhatsApp and other apps. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const vacancy = await repository.getVacancyBySlug((await params).slug);
  const title = vacancy && vacancy.status === "open" ? vacancy.title : "Karier Erdes Group";
  const meta = vacancy
    ? `${vacancy.department}  ·  ${vacancy.location}  ·  ${EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]}`
    : "Lowongan terbuka";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f6f5",
          padding: "72px 80px",
          color: INK,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: REL }} />
            <div style={{ width: 30, height: 8, borderRadius: 4, background: REL }} />
            <div style={{ width: 22, height: 22, borderRadius: 11, border: `5px solid ${REL}` }} />
          </div>
          <div style={{ display: "flex" }}>Erdes Group Karier</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: REL, fontWeight: 600 }}>
            Kami sedang mencari
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: title.length > 28 ? 64 : 84,
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 32, color: MUTED }}>{meta}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: SINYAL,
              border: "5px solid #633806",
            }}
          />
          <div style={{ flexGrow: 1, height: 8, background: REL, opacity: 0.25 }} />
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              border: `5px solid ${REL}`,
              background: "#fff",
            }}
          />
          <div style={{ flexGrow: 1, height: 8, background: REL, opacity: 0.25 }} />
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              border: `5px solid ${REL}`,
              background: "#fff",
            }}
          />
          <div
            style={{ display: "flex", marginLeft: 28, fontSize: 30, fontWeight: 700, color: REL }}
          >
            Lamar sekarang
          </div>
        </div>
      </div>
    ),
    size,
  );
}
