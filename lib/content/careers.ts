/**
 * Public careers copy. Edit here; no schema change needed.
 *
 * `about` is intentionally empty: the home page hides the section until real
 * company text and benefits are filled in. Do not ship invented claims.
 */
export const about: { intro: string; benefits: { title: string; body: string }[] } = {
  intro: "",
  benefits: [],
};

export type FaqItem = {
  question: string;
  answer: string;
  link?: { href: string; label: string };
};

/** Answers describe how this portal actually works. Keep them in sync with the app. */
export const faq: FaqItem[] = [
  {
    question: "Apakah melamar di PT Erdes Desa Maju Bersama dipungut biaya?",
    answer:
      "Tidak. Seluruh proses rekrutmen PT Erdes Desa Maju Bersama tidak dipungut biaya. Jika ada pihak yang meminta uang atas nama kami, abaikan dan hubungi kontak resmi kami.",
  },
  {
    question: "Apakah saya perlu membuat akun?",
    answer:
      "Tidak. Cukup isi formulir lamaran. Setelah terkirim, Anda langsung menerima Applicant ID dan link lacak pribadi.",
  },
  {
    question: "Bagaimana cara mengetahui perkembangan lamaran?",
    answer:
      "Buka halaman lacak, lalu masukkan Applicant ID dari halaman bukti lamaran Anda. Tim kami juga akan menghubungi Anda lewat WhatsApp.",
    link: { href: "/lacak", label: "Lacak lamaran" },
  },
  {
    question: "Saya lupa Applicant ID. Apa yang harus dilakukan?",
    answer:
      "Cari kembali Applicant ID Anda dengan nama lengkap dan nomor WhatsApp yang dipakai saat melamar.",
    link: { href: "/lacak/cari", label: "Cari Applicant ID" },
  },
  {
    question: "Bolehkah melamar lebih dari satu posisi?",
    answer:
      "Boleh. Anda dapat melamar beberapa lowongan yang berbeda, dengan satu lamaran aktif untuk setiap lowongan.",
  },
  {
    question: "Berapa lama proses rekrutmen?",
    answer:
      "Lamanya berbeda untuk setiap posisi. Tahap terbaru lamaran Anda selalu tampil di halaman lacak.",
  },
  {
    question: "Bisakah saya membatalkan lamaran?",
    answer:
      "Bisa, selama lamaran masih aktif. Buka halaman lacak, pilih Tarik lamaran, lalu konfirmasi dengan Applicant ID dan nomor WhatsApp Anda.",
  },
];
