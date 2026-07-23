import { type NewsItem } from "@/data/mock";

const STORAGE_KEY = "clash-soccer-news";

const initialNews: NewsItem[] = [
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

function load(): NewsItem[] {
  if (typeof window === "undefined") return initialNews;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialNews));
      return initialNews;
    }
    return JSON.parse(raw);
  } catch {
    return initialNews;
  }
}

function save(data: NewsItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getNews(): NewsItem[] {
  return load();
}

export function getNewsBySlug(slug: string): NewsItem | undefined {
  return load().find((n) => n.slug === slug);
}

export function createNews(item: NewsItem): NewsItem[] {
  const data = load();
  data.unshift(item);
  save(data);
  return data;
}

export function updateNews(id: string, updates: Partial<NewsItem>): NewsItem[] {
  const data = load().map((n) => (n.id === id ? { ...n, ...updates } : n));
  save(data);
  return data;
}

export function deleteNews(id: string): NewsItem[] {
  const data = load().filter((n) => n.id !== id);
  save(data);
  return data;
}
