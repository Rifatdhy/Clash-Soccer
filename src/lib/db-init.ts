import { query } from "./db";
import fs from "fs";
import path from "path";

export async function initDatabase() {
  try {
    console.log("Initializing database schema...");
    const schemaPath = path.join(process.cwd(), "src/lib/schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    
    // Split SQL by semicolons and execute each statement individually
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await query(stmt);
    }
    console.log("Database schema initialized successfully.");

    // Check if we need to seed initial matches, news, etc.
    const matchCheck = await query("SELECT COUNT(*) FROM matches");
    if (parseInt(matchCheck.rows[0].count) === 0) {
      console.log("Seeding mock matches data...");
      const mockMatches = [
        { id: "m1", title: "Clash Weekly #47", date: "2026-07-04", time: "19:00", location: "Lapangan ABC Sports", slots_total: 20, slots_available: 20, status: "upcoming" },
        { id: "m2", title: "Clash Weekly #48", date: "2026-07-11", time: "19:00", location: "Lapangan ABC Sports", slots_total: 20, slots_available: 20, status: "upcoming" },
        { id: "m3", title: "Clash Weekly #49", date: "2026-07-18", time: "20:00", location: "Lapangan DEF Field", slots_total: 18, slots_available: 18, status: "upcoming" },
        { id: "m4", title: "Clash Cup 2026", date: "2026-07-25", time: "14:00", location: "Stadion GHI", slots_total: 30, slots_available: 30, status: "upcoming" },
        { id: "m5", title: "Clash Weekly #50", date: "2026-08-01", time: "19:00", location: "Lapangan ABC Sports", slots_total: 20, slots_available: 20, status: "upcoming" },
        { id: "m6", title: "Clash Weekly #45", date: "2026-06-20", time: "19:00", location: "Lapangan ABC Sports", slots_total: 20, slots_available: 0, status: "completed" },
        { id: "m7", title: "Clash Weekly #44", date: "2026-06-13", time: "19:00", location: "Lapangan ABC Sports", slots_total: 20, slots_available: 0, status: "completed" },
        { id: "m8", title: "Clash Weekly #43", date: "2026-06-06", time: "20:00", location: "Lapangan DEF Field", slots_total: 18, slots_available: 0, status: "completed" },
      ];

      for (const m of mockMatches) {
        await query(
          `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [m.id, m.title, m.date, m.time, m.location, m.slots_total, m.slots_available, m.status]
        );
      }
    }

    const newsCheck = await query("SELECT COUNT(*) FROM news");
    if (parseInt(newsCheck.rows[0].count) === 0) {
      console.log("Seeding mock news data...");
      const mockNews = [
        {
          id: "n1",
          title: "Clash Cup 2026: Daftar Sekarang!",
          slug: "clash-cup-2026",
          content: "Turnamen tahunan Clash Cup 2026 akan segera digelar. Dengan total hadiah jutaan rupiah, turnamen ini terbuka untuk semua anggota komunitas. Jangan lewatkan kesempatan untuk menunjukkan kemampuan terbaikmu!",
          excerpt: "Turnamen tahunan terbesar Clash.Soccer akan segera digelar.",
          cover_image: "",
          date: "2026-06-25",
        },
        {
          id: "n2",
          title: "Jadwal Pertandingan Bulan Juli",
          slug: "jadwal-juli-2026",
          content: "Berikut adalah jadwal lengkap pertandingan Clash.Soccer untuk bulan Juli 2026. Pastikan kamu melakukan RSVP tepat waktu karena slot terbatas.",
          excerpt: "Cek jadwal lengkap Clash.Soccer bulan Juli 2026.",
          cover_image: "",
          date: "2026-06-28",
        },
        {
          id: "n3",
          title: "Selamat Datang Member Baru!",
          slug: "welcome-new-members",
          content: "Kami dengan senang hati menyambut anggota baru yang bergabung di Clash.Soccer. Komunitas kami terus berkembang dan kami selalu membuka pendaftaran untuk pemain baru di semua level.",
          excerpt: "Komunitas Clash.Soccer terus berkembang.",
          cover_image: "",
          date: "2026-06-22",
        },
        {
          id: "n4",
          title: "Tips Meningkatkan Stamina di Lapangan",
          slug: "tips-stamina",
          content: "Stamina adalah kunci dalam permainan mini soccer. Berikut beberapa tips untuk meningkatkan daya tahan tubuhmu: latihan interval, pola makan sehat, istirahat cukup, dan hidrasi yang baik.",
          excerpt: "Tips menjaga kebugaran untuk performa maksimal.",
          cover_image: "",
          date: "2026-06-15",
        },
      ];

      for (const n of mockNews) {
        await query(
          `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [n.id, n.title, n.slug, n.content, n.excerpt, n.cover_image, n.date]
        );
      }
    }

    const faqCheck = await query("SELECT COUNT(*) FROM faqs");
    if (parseInt(faqCheck.rows[0].count) === 0) {
      console.log("Seeding mock FAQ data...");
      const mockFaqs = [
        { id: "f1", question: "Bagaimana cara mendaftar pertandingan?", answer: "Kunjungi halaman Schedule, pilih pertandingan yang tersedia, lalu klik tombol RSVP. Isi data diri dan jumlah peserta, lalu submit." },
        { id: "f2", question: "Apakah ada biaya untuk bergabung?", answer: "Ya, setiap pertandingan memiliki biaya partisipasi yang dibagi rata berdasarkan jumlah pemain. Info biaya akan muncul saat melakukan RSVP." },
        { id: "f3", question: "Bagaimana jika saya datang terlambat?", answer: "Mohon konfirmasi ke admin melalui WhatsApp jika Anda terlambat. Usahakan datang 15 menit sebelum jadwal untuk pemanasan." },
        { id: "f4", question: "Apa yang harus dibawa ke pertandingan?", answer: "Bawa sepatu futsal, jersey tim (jika ada), air minum, dan perlengkapan pribadi lainnya. Jersey akan disediakan untuk yang belum punya." },
        { id: "f5", question: "Bagaimana cara menjadi admin?", answer: "Admin dipilih oleh komunitas berdasarkan kontribusi dan keaktifan. Hubungi admin melalui WhatsApp untuk informasi lebih lanjut." },
      ];

      for (let i = 0; i < mockFaqs.length; i++) {
        const f = mockFaqs[i];
        await query(
          `INSERT INTO faqs (id, question, answer, display_order)
           VALUES ($1, $2, $3, $4)`,
          [f.id, f.question, f.answer, i]
        );
      }
    }

    const albumCheck = await query("SELECT COUNT(*) FROM albums");
    if (parseInt(albumCheck.rows[0].count) === 0) {
      console.log("Seeding mock album data...");
      const mockAlbums = [
        { id: "a1", title: "Clash Weekly #45", match_date: "2026-06-20", cover_url: "" },
        { id: "a2", title: "Clash Cup 2025", match_date: "2025-12-20", cover_url: "" },
      ];

      for (const a of mockAlbums) {
        await query(
          `INSERT INTO albums (id, title, match_date, cover_url)
           VALUES ($1, $2, $3, $4)`,
          [a.id, a.title, a.match_date, a.cover_url]
        );
      }

      // Seed items
      const mockItems = [
        { id: "g1", album_id: "a1", type: "image", url: "" },
        { id: "g2", album_id: "a1", type: "image", url: "" },
        { id: "g3", album_id: "a1", type: "image", url: "" },
        { id: "g4", album_id: "a1", type: "image", url: "" },
        { id: "g5", album_id: "a1", type: "video", url: "" },
        { id: "g6", album_id: "a2", type: "image", url: "" },
        { id: "g7", album_id: "a2", type: "image", url: "" },
        { id: "g8", album_id: "a2", type: "image", url: "" },
        { id: "g9", album_id: "a2", type: "image", url: "" },
      ];

      for (const item of mockItems) {
        await query(
          `INSERT INTO album_items (id, album_id, type, url)
           VALUES ($1, $2, $3, $4)`,
          [item.id, item.album_id, item.type, item.url]
        );
      }
    }
  } catch (err) {
    console.error("Failed to initialize database:", err);
  }
}