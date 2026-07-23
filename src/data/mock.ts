export interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  slotsTotal: number;
  slotsAvailable: number;
  status: "upcoming" | "ongoing" | "completed";
}

export interface GalleryItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  matchDate: string;
  coverUrl: string;
  gdriveLink?: string;
  items: GalleryItem[];
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  date: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Setting {
  communityName: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  whatsapp: string;
  instagram: string;
  location: string;
  googleMapsEmbed: string;
}

export const settings: Setting = {
  communityName: "Clash.Soccer",
  description: "Komunitas mini soccer terbesar di Jakarta. Bermain, berkompetisi, dan bertumbuh bersama.",
  logoUrl: "",
  bannerUrl: "",
  whatsapp: "6281234567890",
  instagram: "clash.soccer",
  location: "Lapangan ABC Sports, Jakarta Selatan",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!",
};

export const matches: Match[] = [
  {
    id: "m1",
    title: "Clash Weekly #47",
    date: "2026-07-04",
    time: "19:00",
    location: "Lapangan ABC Sports",
    slotsTotal: 20,
    slotsAvailable: 8,
    status: "upcoming",
  },
  {
    id: "m2",
    title: "Clash Weekly #48",
    date: "2026-07-11",
    time: "19:00",
    location: "Lapangan ABC Sports",
    slotsTotal: 20,
    slotsAvailable: 12,
    status: "upcoming",
  },
  {
    id: "m3",
    title: "Clash Weekly #49",
    date: "2026-07-18",
    time: "20:00",
    location: "Lapangan DEF Field",
    slotsTotal: 18,
    slotsAvailable: 3,
    status: "upcoming",
  },
  {
    id: "m4",
    title: "Clash Cup 2026",
    date: "2026-07-25",
    time: "14:00",
    location: "Stadion GHI",
    slotsTotal: 30,
    slotsAvailable: 15,
    status: "upcoming",
  },
  {
    id: "m5",
    title: "Clash Weekly #50",
    date: "2026-08-01",
    time: "19:00",
    location: "Lapangan ABC Sports",
    slotsTotal: 20,
    slotsAvailable: 20,
    status: "upcoming",
  },
  {
    id: "m6",
    title: "Clash Weekly #45",
    date: "2026-06-20",
    time: "19:00",
    location: "Lapangan ABC Sports",
    slotsTotal: 20,
    slotsAvailable: 0,
    status: "completed",
  },
  {
    id: "m7",
    title: "Clash Weekly #44",
    date: "2026-06-13",
    time: "19:00",
    location: "Lapangan ABC Sports",
    slotsTotal: 20,
    slotsAvailable: 0,
    status: "completed",
  },
  {
    id: "m8",
    title: "Clash Weekly #43",
    date: "2026-06-06",
    time: "20:00",
    location: "Lapangan DEF Field",
    slotsTotal: 18,
    slotsAvailable: 0,
    status: "completed",
  },
];

export const albums: Album[] = [
  {
    id: "a1",
    title: "Clash Weekly #45",
    matchDate: "2026-06-20",
    coverUrl: "",
    items: [
      { id: "g1", type: "image", url: "" },
      { id: "g2", type: "image", url: "" },
      { id: "g3", type: "image", url: "" },
      { id: "g4", type: "image", url: "" },
      { id: "g5", type: "video", url: "" },
    ],
  },
  {
    id: "a2",
    title: "Clash Cup 2025",
    matchDate: "2025-12-20",
    coverUrl: "",
    items: [
      { id: "g6", type: "image", url: "" },
      { id: "g7", type: "image", url: "" },
      { id: "g8", type: "image", url: "" },
      { id: "g9", type: "image", url: "" },
    ],
  },
];

export const news: NewsItem[] = [
  {
    id: "n1",
    title: "Clash Cup 2026: Daftar Sekarang!",
    slug: "clash-cup-2026",
    content: "Turnamen tahunan Clash Cup 2026 akan segera digelar. Dengan total hadiah jutaan rupiah, turnamen ini terbuka untuk semua anggota komunitas. Jangan lewatkan kesempatan untuk menunjukkan kemampuan terbaikmu!",
    excerpt: "Turnamen tahunan terbesar Clash.Soccer akan segera digelar.",
    coverImage: "",
    date: "2026-06-25",
  },
  {
    id: "n2",
    title: "Jadwal Pertandingan Bulan Juli",
    slug: "jadwal-juli-2026",
    content: "Berikut adalah jadwal lengkap pertandingan Clash.Soccer untuk bulan Juli 2026. Pastikan kamu melakukan RSVP tepat waktu karena slot terbatas.",
    excerpt: "Cek jadwal lengkap Clash.Soccer bulan Juli 2026.",
    coverImage: "",
    date: "2026-06-28",
  },
  {
    id: "n3",
    title: "Selamat Datang Member Baru!",
    slug: "welcome-new-members",
    content: "Kami dengan senang hati menyambut anggota baru yang bergabung di Clash.Soccer. Komunitas kami terus berkembang dan kami selalu membuka pendaftaran untuk pemain baru di semua level.",
    excerpt: "Komunitas Clash.Soccer terus berkembang.",
    coverImage: "",
    date: "2026-06-22",
  },
  {
    id: "n4",
    title: "Tips Meningkatkan Stamina di Lapangan",
    slug: "tips-stamina",
    content: "Stamina adalah kunci dalam permainan mini soccer. Berikut beberapa tips untuk meningkatkan daya tahan tubuhmu: latihan interval, pola makan sehat, istirahat cukup, dan hidrasi yang baik.",
    excerpt: "Tips menjaga kebugaran untuk performa maksimal.",
    coverImage: "",
    date: "2026-06-15",
  },
];

export const faqs: FaqItem[] = [
  {
    id: "f1",
    question: "Bagaimana cara mendaftar pertandingan?",
    answer: "Kunjungi halaman Schedule, pilih pertandingan yang tersedia, lalu klik tombol RSVP. Isi data diri dan jumlah peserta, lalu submit.",
  },
  {
    id: "f2",
    question: "Apakah ada biaya untuk bergabung?",
    answer: "Ya, setiap pertandingan memiliki biaya partisipasi yang dibagi rata berdasarkan jumlah pemain. Info biaya akan muncul saat melakukan RSVP.",
  },
  {
    id: "f3",
    question: "Bagaimana jika saya datang terlambat?",
    answer: "Mohon konfirmasi ke admin melalui WhatsApp jika Anda terlambat. Usahakan datang 15 menit sebelum jadwal untuk pemanasan.",
  },
  {
    id: "f4",
    question: "Apa yang harus dibawa ke pertandingan?",
    answer: "Bawa sepatu futsal, jersey tim (jika ada), air minum, dan perlengkapan pribadi lainnya. Jersey akan disediakan untuk yang belum punya.",
  },
  {
    id: "f5",
    question: "Bagaimana cara menjadi admin?",
    answer: "Admin dipilih oleh komunitas berdasarkan kontribusi dan keaktifan. Hubungi admin melalui WhatsApp untuk informasi lebih lanjut.",
  },
];

export const rsvpData = [
  {
    id: "r1",
    matchId: "m6",
    participants: [
      { name: "Rifat", whatsapp: "628111111111", jerseySize: "L" },
      { name: "Budi", whatsapp: "628222222222", jerseySize: "M" },
    ],
  },
  {
    id: "r2",
    matchId: "m7",
    participants: [
      { name: "Andi", whatsapp: "628333333333", jerseySize: "XL" },
    ],
  },
  {
    id: "r3",
    matchId: "m6",
    participants: [
      { name: "Cahyo", whatsapp: "628444444444", jerseySize: "L" },
      { name: "Doni", whatsapp: "628555555555", jerseySize: "M" },
      { name: "Eko", whatsapp: "628666666666", jerseySize: "S" },
    ],
  },
];

export function getUpcomingMatches() {
  return matches.filter((m) => m.status === "upcoming");
}

export function getCompletedMatches() {
  return matches.filter((m) => m.status === "completed");
}

export function getMatchById(id: string) {
  return matches.find((m) => m.id === id);
}

export function getAlbumById(id: string) {
  return albums.find((a) => a.id === id);
}

export function getNewsBySlug(slug: string) {
  return news.find((n) => n.slug === slug);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(timeStr: string) {
  return timeStr.substring(0, 5);
}
