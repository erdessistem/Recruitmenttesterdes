import "server-only";

import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { pdfSafeText, type ApplicantPdfModel, type PdfField } from "@/lib/admin/applicant-pdf-model";

const FONT_DIR = path.join(process.cwd(), "node_modules/@fontsource/plus-jakarta-sans/files");
const FAMILY = "Plus Jakarta Sans";

Font.register({
  family: FAMILY,
  fonts: [400, 600, 700].map((weight) => ({
    src: path.join(FONT_DIR, `plus-jakarta-sans-latin-${weight}-normal.woff`),
    fontWeight: weight,
  })),
});
// Break only very long words (URLs, IDs) and never hyphenate Indonesian words.
Font.registerHyphenationCallback((word) =>
  word.length > 28 ? (word.match(/.{1,20}/g) ?? [word]) : [word],
);

const C = {
  ink: "#18222d",
  muted: "#5b6673",
  line: "#dfe4e8",
  paper: "#f4f6f5",
  primary: "#0f6e56",
  primarySoft: "#e3f1ec",
  sinyal: "#ef9f27",
  danger: "#b42318",
  dangerSoft: "#fdeceb",
};

const s = StyleSheet.create({
  page: {
    fontFamily: FAMILY,
    fontSize: 9.5,
    color: C.ink,
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: 44,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.sinyal },
  bar: { width: 9, height: 3, borderRadius: 1.5, backgroundColor: C.primary, marginHorizontal: 2 },
  ring: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.6, borderColor: C.primary },
  brandName: { marginLeft: 7, fontSize: 12, fontWeight: 700 },
  docKind: { fontSize: 8, fontWeight: 700, letterSpacing: 1.4, color: C.primary, textAlign: "right" },
  docSub: { fontSize: 7.5, color: C.muted, textAlign: "right", marginTop: 1 },

  hero: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 6 },
  heroLeft: { flex: 1, paddingRight: 20 },
  eyebrow: { fontSize: 7.5, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  name: { fontSize: 21, fontWeight: 700, lineHeight: 1.2, marginTop: 3 },
  position: { fontSize: 11.5, fontWeight: 600, color: C.primary, marginTop: 2 },
  positionDetail: { fontSize: 9, color: C.muted, marginTop: 1 },
  metaBox: {
    width: 190,
    backgroundColor: C.primarySoft,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  metaRow: { paddingVertical: 3 },
  metaLabel: { fontSize: 7, color: C.muted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 2 },
  metaValue: { fontSize: 9, fontWeight: 600 },

  notice: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
    backgroundColor: C.dangerSoft,
    color: C.danger,
    fontSize: 8.5,
  },

  section: { marginTop: 18 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  sectionNo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.primary,
    color: "#ffffff",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
    paddingTop: 2.5,
    lineHeight: 1,
  },
  sectionTitle: { marginLeft: 7, fontSize: 10.5, fontWeight: 700 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8 },
  field: {
    width: "50%",
    paddingHorizontal: 8,
    paddingTop: 7,
  },
  fieldWide: { width: "100%" },
  fieldInner: { paddingBottom: 6, borderBottomWidth: 0.75, borderBottomColor: C.line },
  label: { fontSize: 7.5, color: C.muted, marginBottom: 2.5 },
  value: { fontSize: 9.5, lineHeight: 1.45 },
  fieldNote: { fontSize: 7.5, color: C.primary, marginTop: 1.5 },

  qa: { paddingTop: 7, paddingBottom: 6, borderBottomWidth: 0.75, borderBottomColor: C.line },
  question: { fontSize: 8, lineHeight: 1.4, color: C.muted },
  answerRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 1.5 },
  answer: { fontSize: 9.5, fontWeight: 600 },
  flag: {
    marginLeft: 6,
    fontSize: 7,
    fontWeight: 600,
    color: C.danger,
    backgroundColor: C.dangerSoft,
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
  },
  paragraph: { marginTop: 8, fontSize: 9.5, lineHeight: 1.6 },

  table: { marginTop: 8, borderWidth: 0.75, borderColor: C.line, borderRadius: 4 },
  tr: { flexDirection: "row", borderTopWidth: 0.75, borderTopColor: C.line },
  th: {
    flexDirection: "row",
    backgroundColor: C.paper,
    fontSize: 7.5,
    fontWeight: 600,
    color: C.muted,
  },
  td: { paddingVertical: 5, paddingHorizontal: 8, fontSize: 8.5, lineHeight: 1.4 },
  colAt: { width: "32%" },
  colEvent: { width: "40%" },
  colBy: { width: "28%" },

  consent: { marginTop: 8, fontSize: 8.5, lineHeight: 1.5, color: C.muted },
  signRow: { flexDirection: "row", marginTop: 26, marginHorizontal: -10 },
  signBox: { flex: 1, marginHorizontal: 10 },
  signLabel: { fontSize: 8, color: C.muted },
  signLine: { marginTop: 44, borderTopWidth: 0.75, borderTopColor: C.ink, paddingTop: 3 },
  signHint: { fontSize: 7.5, color: C.muted },

  footerRule: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 42,
    borderTopWidth: 0.75,
    borderTopColor: C.line,
  },
  footerLeft: { position: "absolute", left: 44, bottom: 28, fontSize: 7, color: C.muted },
  footerRight: {
    position: "absolute",
    right: 44,
    bottom: 28,
    width: 120,
    fontSize: 7,
    color: C.muted,
    textAlign: "right",
  },
});

/** Text that drops glyphs the embedded font cannot draw. */
function T({ children, style, fixed }: { children: string; style?: Style | Style[]; fixed?: boolean }) {
  return (
    <Text style={style} fixed={fixed}>
      {pdfSafeText(children)}
    </Text>
  );
}

function SectionHead({ no, title }: { no: number; title: string }) {
  return (
    <View style={s.sectionHead} minPresenceAhead={60}>
      <Text style={s.sectionNo}>{String(no)}</Text>
      <T style={s.sectionTitle}>{title}</T>
    </View>
  );
}

function Field({ field }: { field: PdfField }) {
  return (
    <View style={field.wide ? [s.field, s.fieldWide] : s.field} wrap={false}>
      <View style={s.fieldInner}>
        <T style={s.label}>{field.label}</T>
        <T style={s.value}>{field.value}</T>
        {field.note ? <T style={s.fieldNote}>{field.note}</T> : null}
      </View>
    </View>
  );
}

export function ApplicantPdf({ model }: { model: ApplicantPdfModel }) {
  let no = 0;
  return (
    <Document
      title={pdfSafeText(`Formulir Lamaran Kerja - ${model.name}`)}
      author={pdfSafeText(model.company)}
      subject={pdfSafeText(`Lamaran ${model.position}`)}
      creator={pdfSafeText(`${model.company} Rekrutmen`)}
      producer={pdfSafeText(`${model.company} Rekrutmen`)}
      language="id-ID"
    >
      <Page size="A4" style={s.page}>
        <View style={s.footerRule} fixed />
        <T style={s.footerLeft} fixed>{`${model.printed} · Dokumen rahasia, jangan disebarluaskan`}</T>
        <Text
          style={s.footerRight}
          fixed
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
        />
        <View style={s.header} fixed>
          <View style={s.brand}>
            <View style={s.dot} />
            <View style={s.bar} />
            <View style={s.ring} />
            <T style={s.brandName}>{model.company}</T>
          </View>
          <View>
            <Text style={s.docKind}>FORMULIR LAMARAN KERJA</Text>
            <Text style={s.docSub}>Rahasia · berisi data pribadi</Text>
          </View>
        </View>

        <View style={s.hero} wrap={false}>
          <View style={s.heroLeft}>
            <Text style={s.eyebrow}>Nama pelamar</Text>
            <T style={s.name}>{model.name}</T>
            <Text style={[s.eyebrow, { marginTop: 12 }]}>Posisi dilamar</Text>
            <T style={s.position}>{model.position}</T>
            {model.positionDetail ? <T style={s.positionDetail}>{model.positionDetail}</T> : null}
          </View>
          <View style={s.metaBox}>
            {model.meta.map(([label, value]) => (
              <View key={label} style={s.metaRow}>
                <T style={s.metaLabel}>{label}</T>
                <T style={s.metaValue}>{value}</T>
              </View>
            ))}
          </View>
        </View>

        {model.anonymizedNotice ? <T style={s.notice}>{model.anonymizedNotice}</T> : null}

        {model.sections.map((section) => (
          <View key={section.title} style={s.section} wrap={false}>
            <SectionHead no={++no} title={section.title} />
            <View style={s.grid}>
              {section.fields.map((field) => (
                <Field key={field.label} field={field} />
              ))}
            </View>
          </View>
        ))}

        {model.screening.length > 0 && (
          <View style={s.section}>
            <SectionHead no={++no} title="Jawaban pertanyaan screening" />
            {model.screening.map((item, index) => (
              <View key={index} style={s.qa} wrap={false}>
                <T style={s.question}>{`${index + 1}. ${item.question}`}</T>
                <View style={s.answerRow}>
                  <T style={s.answer}>{item.answer}</T>
                  {item.flag ? <T style={s.flag}>{item.flag}</T> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={s.section}>
          <SectionHead no={++no} title="Motivasi melamar" />
          <T style={s.paragraph}>{model.motivation}</T>
        </View>

        {model.history.length > 0 && (
          <View style={s.section}>
            <SectionHead no={++no} title="Riwayat tahap rekrutmen" />
            <View style={s.table}>
              <View style={s.th}>
                <Text style={[s.td, s.colAt]}>Waktu</Text>
                <Text style={[s.td, s.colEvent]}>Kejadian</Text>
                <Text style={[s.td, s.colBy]}>Oleh</Text>
              </View>
              {model.history.map((row, index) => (
                <View key={index} style={s.tr} wrap={false}>
                  <T style={[s.td, s.colAt]}>{row.at}</T>
                  <T style={[s.td, s.colEvent]}>{row.event}</T>
                  <T style={[s.td, s.colBy]}>{row.by}</T>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.section} wrap={false}>
          <SectionHead no={++no} title="Persetujuan data dan pemeriksaan" />
          <T style={s.consent}>{model.consent}</T>
          <View style={s.signRow}>
            {["Diperiksa oleh (HR)", "Disetujui oleh (user)"].map((label) => (
              <View key={label} style={s.signBox}>
                <Text style={s.signLabel}>{label}</Text>
                <View style={s.signLine}>
                  <Text style={s.signHint}>Nama, tanda tangan, tanggal</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </Page>
    </Document>
  );
}

export function renderApplicantPdf(model: ApplicantPdfModel): Promise<Buffer> {
  return renderToBuffer(<ApplicantPdf model={model} />);
}
