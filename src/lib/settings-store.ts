import { type Setting, type FaqItem } from "@/data/mock";

const SETTINGS_KEY = "clash-soccer-settings";
const FAQS_KEY = "clash-soccer-faqs";

const initialSettings: Setting = {
  communityName: "Clash.Soccer",
  description: "Komunitas mini soccer terbesar di Jakarta. Bermain, berkompetisi, dan bertumbuh bersama.",
  logoUrl: "",
  bannerUrl: "",
  whatsapp: "6281234567890",
  instagram: "clash.soccer",
  location: "Lapangan ABC Sports, Jakarta Selatan",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!",
};

const initialFaqs: FaqItem[] = [
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

function loadSettings(): Setting {
  if (typeof window === "undefined") return initialSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
      return initialSettings;
    }
    return JSON.parse(raw);
  } catch {
    return initialSettings;
  }
}

function saveSettings(data: Setting) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

function loadFaqs(): FaqItem[] {
  if (typeof window === "undefined") return initialFaqs;
  try {
    const raw = localStorage.getItem(FAQS_KEY);
    if (!raw) {
      localStorage.setItem(FAQS_KEY, JSON.stringify(initialFaqs));
      return initialFaqs;
    }
    return JSON.parse(raw);
  } catch {
    return initialFaqs;
  }
}

function saveFaqs(data: FaqItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAQS_KEY, JSON.stringify(data));
}

export function getSettings(): Setting {
  return loadSettings();
}

export function updateSettings(updates: Partial<Setting>): Setting {
  const data = { ...loadSettings(), ...updates };
  saveSettings(data);
  return data;
}

export function getFaqs(): FaqItem[] {
  return loadFaqs();
}

export function createFaq(faq: FaqItem): FaqItem[] {
  const data = loadFaqs();
  data.push(faq);
  saveFaqs(data);
  return data;
}

export function updateFaq(id: string, field: "question" | "answer", value: string): FaqItem[] {
  const data = loadFaqs().map((f) => (f.id === id ? { ...f, [field]: value } : f));
  saveFaqs(data);
  return data;
}

export function deleteFaq(id: string): FaqItem[] {
  const data = loadFaqs().filter((f) => f.id !== id);
  saveFaqs(data);
  return data;
}
