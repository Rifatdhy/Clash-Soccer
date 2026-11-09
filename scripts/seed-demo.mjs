/**
 * Seed the database with demo content so the site looks alive.
 *
 * Images are downloaded once and stored through the real storage driver, so
 * every URL in the database is an app-relative `/api/uploads/<key>`. Hotlinking
 * Unsplash would break the admin's own image validation, fail offline, and make
 * the site depend on a third party staying up.
 *
 * Everything uses a `demo-` id prefix and deterministic storage keys, so
 * `--reset` removes exactly what this script created and nothing else.
 *
 *   npm run seed:demo            insert (skips rows that already exist)
 *   npm run seed:demo -- --reset delete demo rows first, then insert
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(rootDir, ".env.local"));
loadEnvFile(join(rootDir, ".env"));

if (!process.env.DATABASE_URL) {
  console.log("SKIP: DATABASE_URL not set.");
  process.exit(2);
}

const reset = process.argv.includes("--reset");
const imageCacheDir = join(rootDir, ".data", "demo-images");
mkdirSync(imageCacheDir, { recursive: true });

const { query, withTransaction } = await import("../src/lib/db.ts");
const { putObject } = await import("../src/lib/storage.ts");

// --- Dates relative to today, so the demo never looks stale -----------------
function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// --- Images -----------------------------------------------------------------
// Each entry is a photo id verified to return a real JPEG. A 404 would store a
// 29-byte HTML error page as an "image", which is worse than a missing picture.
const PHOTOS = [
  "photo-1517649763962-0c623066013b",
  "photo-1574629810360-7efbbe195018",
  "photo-1551958219-acbc608c6377",
  "photo-1553778263-73a83bab9b0c",
  "photo-1522778119026-d647f0596c20",
  "photo-1431324155629-1a6deb1dec8d",
  "photo-1459865264687-595d652de67e",
  "photo-1489944440615-453fc2b6a9a9",
  "photo-1503342217505-b0a15ec3261c",
  "photo-1493925410384-84f842e616fb",
  "photo-1560272564-c83b66b1ad12",
  "photo-1518091043644-c1d4457512c6",
  "photo-1543326727-cf6c39e8f84c",
  "photo-1526232761682-d26e03ac148e",
  "photo-1508609349937-5ec4ae374ebf",
  "photo-1487466365202-1afdb86c764e",
  "photo-1556056504-5c7696c4c28d",
  "photo-1547949003-9792a18a2601",
];

async function fetchPhoto(id, width) {
  const cachePath = join(imageCacheDir, `${id}-${width}.jpg`);
  if (existsSync(cachePath)) return readFileSync(cachePath);

  const url = `https://images.unsplash.com/${id}?w=${width}&q=80&fm=jpg&fit=crop`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Image ${id} returned ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  // Guard against an HTML error page being stored as a JPEG.
  if (bytes.length < 1000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error(`Image ${id} did not return a JPEG (${bytes.length} bytes)`);
  }
  writeFileSync(cachePath, bytes);
  return bytes;
}

const uploaded = new Map();

async function storeImage(key, photoId, width = 1200) {
  if (uploaded.has(key)) return uploaded.get(key);
  const bytes = await fetchPhoto(photoId, width);
  const { url } = await putObject({ key, body: bytes, contentType: "image/jpeg" });
  uploaded.set(key, url);
  console.log(`  image ${key} (${Math.round(bytes.length / 1024)} KB)`);
  return url;
}

let photoCursor = 0;
function nextPhoto() {
  const id = PHOTOS[photoCursor % PHOTOS.length];
  photoCursor += 1;
  return id;
}

// --- Content ----------------------------------------------------------------
const MATCHES = [
  {
    id: "demo-match-01",
    title: "Clash Cup — Matchday 1",
    offset: -35,
    time: "16:00",
    location: "Detos Mini Soccer, Depok",
    slotsTotal: 20,
    status: "completed",
    rsvpCount: 4,
  },
  {
    id: "demo-match-02",
    title: "Friendly vs Margonda FC",
    offset: -21,
    time: "19:30",
    location: "Lapangan Margonda, Depok",
    slotsTotal: 20,
    status: "completed",
    rsvpCount: 3,
  },
  {
    id: "demo-match-03",
    title: "Clash Cup — Matchday 2",
    offset: -7,
    time: "16:00",
    location: "Detos Mini Soccer, Depok",
    slotsTotal: 22,
    status: "completed",
    rsvpCount: 5,
  },
  {
    id: "demo-match-04",
    title: "Latihan Rutin Rabu",
    offset: 0,
    time: "20:00",
    location: "Detos Mini Soccer, Depok",
    slotsTotal: 20,
    status: "ongoing",
    rsvpCount: 3,
  },
  {
    id: "demo-match-05",
    title: "Clash Cup — Semifinal",
    offset: 4,
    time: "16:00",
    location: "Detos Mini Soccer, Depok",
    slotsTotal: 20,
    status: "upcoming",
    rsvpCount: 4,
  },
  {
    id: "demo-match-06",
    title: "Friendly vs Beji United",
    offset: 11,
    time: "19:00",
    location: "Lapangan Beji, Depok",
    slotsTotal: 18,
    status: "upcoming",
    rsvpCount: 2,
  },
  {
    id: "demo-match-07",
    title: "Clash Cup — Final",
    offset: 18,
    time: "16:00",
    location: "Detos Mini Soccer, Depok",
    slotsTotal: 20,
    status: "upcoming",
    rsvpCount: 1,
  },
];

const PEOPLE = [
  ["Rizky Pratama", "6281200000011", "L"],
  ["Dimas Saputra", "6281200000012", "M"],
  ["Fajar Nugroho", "6281200000013", "XL"],
  ["Andi Wijaya", "6281200000014", "M"],
  ["Bagas Ramadhan", "6281200000015", "L"],
  ["Yoga Prasetyo", "6281200000016", "S"],
  ["Hendra Gunawan", "6281200000017", "XXL"],
  ["Ilham Maulana", "6281200000018", "M"],
  ["Reza Fadillah", "6281200000019", "L"],
  ["Sandi Kurniawan", "6281200000020", "M"],
  ["Taufik Hidayat", "6281200000021", "XL"],
  ["Arif Setiawan", "6281200000022", "L"],
];

const ALBUMS = [
  {
    id: "demo-album-01",
    title: "Clash Cup — Matchday 2",
    offset: -7,
    itemCount: 6,
    gdriveLink: "https://drive.google.com/drive/folders/demo-clash-cup-matchday-2",
  },
  {
    id: "demo-album-02",
    title: "Friendly vs Margonda FC",
    offset: -21,
    itemCount: 6,
  },
  {
    id: "demo-album-03",
    title: "Latihan Rutin & Team Building",
    offset: -35,
    itemCount: 6,
  },
];

const NEWS = [
  {
    id: "demo-news-01",
    title: "Clash Cup 2026 Resmi Dimulai",
    slug: "clash-cup-2026-resmi-dimulai",
    offset: -6,
    excerpt:
      "Musim baru Clash Cup dibuka dengan 12 tim peserta dari Depok dan sekitarnya. Matchday pertama berlangsung seru dengan 31 gol tercipta.",
    content:
      "Clash Cup 2026 akhirnya bergulir setelah persiapan selama dua bulan. Sebanyak 12 tim mendaftar, melampaui target awal yang hanya 8 tim. Panitia memutuskan menambah satu hari pertandingan agar semua tim mendapat jadwal yang adil. Matchday pertama sendiri menghasilkan 31 gol dari 6 pertandingan, angka tertinggi dalam tiga tahun terakhir. Panitia juga memperkenalkan aturan baru soal pergantian pemain bebas, yang langsung disambut positif oleh para kapten tim. Klasemen sementara bisa dilihat di halaman jadwal, dan matchday berikutnya dijadwalkan dua pekan lagi",
  },
  {
    id: "demo-news-02",
    title: "Pendaftaran Anggota Baru Dibuka",
    slug: "pendaftaran-anggota-baru-dibuka",
    offset: -13,
    excerpt:
      "Kuota 25 anggota baru untuk periode ini dibuka mulai hari ini. Tidak ada seleksi kemampuan, hanya komitmen hadir latihan rutin tiap Rabu.",
    content:
      "Komunitas Clash.Soccer membuka pendaftaran anggota baru dengan kuota 25 orang. Tidak ada seleksi berdasarkan kemampuan, karena komunitas ini memang dibangun untuk siapa saja yang ingin rutin bermain. Syarat utamanya hanya satu: bersedia hadir di latihan Rabu malam secara konsisten. Biaya iuran bulanan dipakai untuk sewa lapangan, wasit, dan perlengkapan tim. Pendaftaran dilakukan lewat formulir RSVP di halaman jadwal, dan slot akan ditutup lebih awal bila kuota sudah penuh",
  },
  {
    id: "demo-news-03",
    title: "Jersey Baru Tim Sudah Tiba",
    slug: "jersey-baru-tim-sudah-tiba",
    offset: -20,
    excerpt:
      "Desain jersey musim ini memakai warna hitam dengan aksen kuning, terinspirasi dari identitas visual komunitas. Distribusi dilakukan Sabtu ini.",
    content:
      "Setelah proses desain selama tiga minggu, jersey musim ini akhirnya tiba di markas tim. Warna dasar hitam dipadukan aksen kuning, mengikuti identitas visual yang dipakai di situs dan media sosial komunitas. Bahan yang dipakai adalah dry-fit lokal dengan sirkulasi udara yang lebih baik dibanding jersey musim lalu. Nomor punggung dan nama bisa dicetak sesuai permintaan, dengan tambahan biaya yang sudah diumumkan di grup. Distribusi dilakukan Sabtu ini di Detos Mini Soccer mulai pukul 10 pagi",
  },
  {
    id: "demo-news-04",
    title: "Rekap Statistik Musim Lalu",
    slug: "rekap-statistik-musim-lalu",
    offset: -34,
    excerpt:
      "Total 48 pertandingan, 214 gol, dan satu rekor tak terkalahkan selama sembilan laga. Ini rangkuman musim lalu dalam angka.",
    content:
      "Musim lalu ditutup dengan total 48 pertandingan yang tersebar di 16 pekan. Sebanyak 214 gol tercipta, atau rata-rata 4,5 gol per laga. Rekor paling menonjol adalah sembilan pertandingan tanpa kekalahan yang dicatat salah satu tim antara bulan Mei dan Juli. Kehadiran pemain juga meningkat 22 persen dibanding musim sebelumnya, sebagian besar berkat pengingat otomatis lewat WhatsApp. Catatan lengkap per pemain sedang disusun dan akan dibagikan lewat grup internal pekan depan",
  },
  {
    id: "demo-news-05",
    title: "Kerja Sama dengan Detos Mini Soccer",
    slug: "kerja-sama-dengan-detos-mini-soccer",
    offset: -48,
    excerpt:
      "Komunitas resmi bermitra dengan Detos Mini Soccer untuk jadwal tetap tiap Rabu dan Sabtu, termasuk potongan harga sewa lapangan.",
    content:
      "Clash.Soccer resmi menjalin kerja sama dengan Detos Mini Soccer sebagai markas utama. Kerja sama ini memberi komunitas jadwal tetap setiap Rabu dan Sabtu, plus potongan harga sewa lapangan untuk sesi latihan. Sebagai timbal balik, komunitas membantu mempromosikan lapangan lewat media sosial dan turnamen yang digelar di sana. Kesepakatan berlaku untuk satu tahun dan bisa diperpanjang setelah evaluasi bersama di akhir periode",
  },
];

const FAQS = [
  {
    question: "Apakah saya perlu pengalaman bermain untuk bergabung?",
    answer:
      "Tidak. Clash.Soccer terbuka untuk semua level, termasuk yang baru mulai bermain. Latihan rutin dibagi ke beberapa sesi dengan intensitas berbeda, jadi Anda bisa memilih sesi yang paling sesuai.",
  },
  {
    question: "Berapa iuran anggota per bulan?",
    answer:
      "Iuran bulanan dipakai untuk sewa lapangan, wasit, dan perlengkapan tim. Besarannya diumumkan di grup internal setiap awal bulan dan bisa berubah tergantung jumlah anggota aktif.",
  },
  {
    question: "Bagaimana cara mendaftar ikut pertandingan?",
    answer:
      "Buka halaman Jadwal, pilih pertandingan yang masih tersedia slotnya, lalu isi formulir RSVP dengan nama dan nomor WhatsApp. Konfirmasi muncul langsung di halaman tersebut.",
  },
  {
    question: "Apakah slot pertandingan bisa penuh?",
    answer:
      "Bisa. Setiap pertandingan punya batas jumlah pemain, dan sisa slot ditampilkan secara langsung di halaman jadwal. Pendaftaran ditutup otomatis ketika slot habis.",
  },
  {
    question: "Di mana lokasi latihan rutin?",
    answer:
      "Latihan rutin diadakan di Detos Mini Soccer, Depok, setiap Rabu malam. Untuk pertandingan tandang, lokasi selalu dicantumkan di halaman jadwal masing-masing pertandingan.",
  },
  {
    question: "Bagaimana kalau saya harus membatalkan pendaftaran?",
    answer:
      "Hubungi admin lewat WhatsApp yang tertera di halaman Kontak. Pembatalan sebaiknya dilakukan paling lambat sehari sebelum pertandingan agar slot bisa diberikan ke anggota lain.",
  },
];

// --- Run --------------------------------------------------------------------
async function main() {
  console.log("Seeding demo content...\n");

  if (reset) {
    console.log("Resetting demo rows...");
    await query("DELETE FROM rsvps WHERE match_id LIKE 'demo-%'");
    await query("DELETE FROM album_items WHERE album_id LIKE 'demo-%'");
    await query("DELETE FROM albums WHERE id LIKE 'demo-%'");
    await query("DELETE FROM news WHERE id LIKE 'demo-%'");
    await query("DELETE FROM matches WHERE id LIKE 'demo-%'");
    await query("DELETE FROM faqs WHERE id LIKE 'demo-%'");
    console.log("  done\n");
  }

  // Images first: if one fails, nothing is written to the database.
  console.log("Storing images...");
  const albumCovers = [];
  const albumItems = [];
  for (const album of ALBUMS) {
    albumCovers.push(await storeImage(`demo/${album.id}-cover.jpg`, nextPhoto(), 1200));
    const items = [];
    for (let i = 0; i < album.itemCount; i += 1) {
      items.push(await storeImage(`demo/${album.id}-${i + 1}.jpg`, nextPhoto(), 1000));
    }
    albumItems.push(items);
  }
  const newsCovers = [];
  for (const item of NEWS) {
    newsCovers.push(await storeImage(`demo/${item.id}-cover.jpg`, nextPhoto(), 1200));
  }
  const logoUrl = await storeImage("demo/logo.jpg", nextPhoto(), 400);
  const bannerUrl = await storeImage("demo/banner.jpg", nextPhoto(), 1600);
  console.log("");

  const inserted = { matches: 0, rsvps: 0, albums: 0, albumItems: 0, news: 0, faqs: 0 };

  await withTransaction(async (client) => {
    // Matches + RSVPs. slots_available is derived from the participants we
    // actually insert, so the counter can never disagree with the list.
    for (const match of MATCHES) {
      const res = await client.query(
        `INSERT INTO matches (id, title, date, time, location, slots_total, slots_available, status)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [match.id, match.title, isoDate(match.offset), match.time, match.location, match.slotsTotal, match.status]
      );
      if (res.rowCount === 0) continue;
      inserted.matches += 1;

      const chosen = PEOPLE.slice(0, match.rsvpCount);
      if (chosen.length === 0) continue;

      const participants = chosen.map(([name, whatsapp, jerseySize]) => ({
        name,
        whatsapp,
        jerseySize,
      }));
      const registeredAt = new Date(Date.now() + match.offset * 86_400_000).toISOString();

      await client.query(
        `INSERT INTO rsvps (id, match_id, participants, registered_at)
         VALUES ($1, $2, $3, $4)`,
        [`demo-rsvp-${match.id}-${randomUUID().slice(0, 8)}`, match.id, JSON.stringify(participants), registeredAt]
      );
      await client.query("UPDATE matches SET slots_available = $1 WHERE id = $2", [
        match.slotsTotal - participants.length,
        match.id,
      ]);
      inserted.rsvps += 1;
    }

    // Albums + items
    for (let a = 0; a < ALBUMS.length; a += 1) {
      const album = ALBUMS[a];
      const res = await client.query(
        `INSERT INTO albums (id, title, match_date, cover_url, gdrive_link)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [album.id, album.title, isoDate(album.offset), albumCovers[a], album.gdriveLink ?? null]
      );
      if (res.rowCount === 0) continue;
      inserted.albums += 1;

      for (let i = 0; i < albumItems[a].length; i += 1) {
        await client.query(
          `INSERT INTO album_items (id, album_id, type, url)
           VALUES ($1, $2, 'image', $3)`,
          [`demo-item-${album.id}-${i + 1}`, album.id, albumItems[a][i]]
        );
        inserted.albumItems += 1;
      }
    }

    // News
    for (let n = 0; n < NEWS.length; n += 1) {
      const item = NEWS[n];
      const res = await client.query(
        `INSERT INTO news (id, title, slug, content, excerpt, cover_image, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.title, item.slug, item.content, item.excerpt, newsCovers[n], isoDate(item.offset)]
      );
      if (res.rowCount > 0) inserted.news += 1;
    }

    // FAQs
    for (let f = 0; f < FAQS.length; f += 1) {
      const faq = FAQS[f];
      const res = await client.query(
        `INSERT INTO faqs (id, question, answer, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [`demo-faq-${String(f + 1).padStart(2, "0")}`, faq.question, faq.answer, f]
      );
      if (res.rowCount > 0) inserted.faqs += 1;
    }

    // Settings: fill the fields the public site actually reads.
    await client.query(
      `UPDATE settings
         SET description = $1,
             whatsapp = $2,
             instagram = $3,
             location = $4,
             logo_url = $5,
             banner_url = $6,
             google_maps_embed = $7
       WHERE id = 'default'`,
      [
        "Komunitas mini soccer Depok yang rutin bermain tiap Rabu dan Sabtu. Terbuka untuk semua level, dari yang baru mulai sampai yang sudah lama di lapangan.",
        "6281200000011",
        "clash.soccer",
        "Detos Mini Soccer, Depok",
        logoUrl,
        bannerUrl,
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!",
      ]
    );
  });

  console.log("\nInserted:");
  for (const [key, value] of Object.entries(inserted)) {
    console.log(`  ${key.padEnd(11)} ${value}`);
  }

  const counts = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM matches) AS matches,
       (SELECT COUNT(*)::int FROM rsvps) AS rsvps,
       (SELECT COUNT(*)::int FROM albums) AS albums,
       (SELECT COUNT(*)::int FROM album_items) AS album_items,
       (SELECT COUNT(*)::int FROM news) AS news,
       (SELECT COUNT(*)::int FROM faqs) AS faqs`
  );
  console.log("\nTotals now in database:");
  console.log(" ", JSON.stringify(counts.rows[0]));
}

try {
  await main();
  console.log("\nSEED OK");
  process.exit(0);
} catch (error) {
  console.error("\nSEED FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
}
