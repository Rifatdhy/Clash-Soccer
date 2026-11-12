# Clash.Soccer Band-Club Experience Design

## Intent

Membentuk Clash.Soccer sebagai gabungan antara klub mini soccer lokal dan band yang sedang menjalani tour: pertandingan adalah show date, homepage adalah venue board, dan news/gallery menjadi archive komunitas.

## Chosen direction

Menggabungkan tiga pola referensi:

1. **Tour dates** — struktur jadwal seperti halaman tour band: next show, upcoming dates, past archive, venue, waktu, dan action.
2. **Band poster** — visual matchday yang kuat: tanggal besar, layout poster, hierarchy yang berani, dan aksen warna brand.
3. **Fan club/archive** — komunitas berkelanjutan melalui news, gallery, social links, dan dokumentasi momen pertandingan.

Struktur dan CTA tetap mengikuti kebutuhan RSVP Clash.Soccer; referensi band hanya digunakan sebagai pola experience, bukan ditiru secara literal.

## Goals

- Membuat pertandingan berikutnya terasa seperti acara yang ingin dihadiri.
- Membuat Schedule terbaca seperti tour dates dan tetap mudah dipakai untuk RSVP.
- Memberi setiap pertandingan hierarchy visual yang kuat tanpa membuat informasi praktis tersembunyi.
- Menjadikan News dan Gallery sebagai archive hidup komunitas.
- Memperkuat social/community layer untuk repeat visitors.
- Memakai logo pengguna dari `public/logo.png` sebagai crest utama.
- Menjaga layout responsive dan accessible di desktop maupun mobile.

## Non-goals

- Tidak menyalin logo, copy, foto, layout spesifik, atau aset dari band mana pun.
- Tidak mengubah database schema, API RSVP, auth, rate limit, capacity locking, atau validasi.
- Tidak membuat payment flow, newsletter backend, atau ticketing system baru.
- Tidak mengganti logo pengguna dengan mark baru.

## Experience architecture

```text
Homepage
  Clash.Soccer / weekly football ritual
  Next show: next match + venue + time + slots
  Join this game
  Activity strip: rhythm, home ground, player level, capacity
  Upcoming dates preview
  From the pitch: latest news
  The Clash archive: latest gallery
  Join the club: how to play + social CTA

Schedule
  Upcoming games / tour dates
  Month/date hierarchy
  Match title, venue, time, available slots
  RSVP / open fixture
  Past games archive

News
  From the pitch
  Match reports, community stories, updates

Gallery
  The Clash archive
  Matchday albums and moments

FAQ / Contact
  Fan club utility: how to join, location, rules, what to bring, contact
```

## Homepage visual composition

Hero is one screen and carries the primary action:

```text
DEPok · EST. 2024

THE GAME
IS BETTER
TOGETHER.

NEXT SHOW
Latihan Rutin Rabu
Depok Mini Soccer
20:00 WIB · 17 spots left

[JOIN THIS GAME]
```

Below the hero, the activity strip acts like a band tour metadata line:

```text
WEDNESDAY + SATURDAY · DEPOK · ALL LEVELS WELCOME · 18 PLAYERS
```

Upcoming fixtures use a poster/scorecard hybrid. Date and month are visually prominent, while venue, time, capacity, and RSVP remain plain text and readable.

## Fixture behavior

- `Join this game` links to the existing detail/RSVP route for the displayed match.
- `RSVP` or `Open fixture` uses the existing match detail route; no fake action buttons.
- Available slots are shown before the click.
- Full matches show `Fully booked` and use `View fixture`, not `Join this game`.
- If no upcoming match exists, the hero links to `/schedule` and shows an honest empty state.
- Past games remain available as archive content without implying RSVP availability.

## Archive/community layer

Use existing News and Gallery data, with presentation labels:

- `From the pitch` for news and match stories.
- `The Clash archive` for gallery albums.
- `Keep up with Clash` for Instagram/contact/community links.

No content is invented. Existing title, excerpt, date, album, and image data remain the source of truth.

## Visual system

- Primary logo: `public/logo.png`.
- Palette: ivory paper, ink black/navy, logo red, restrained green.
- Typography: existing display serif for poster headlines and condensed sans for metadata.
- Fixture treatment: flat poster/scorecard surfaces, sharp separators, minimal shadow.
- Decorative grid and circles remain subtle; real fixture data and real images lead.
- Iconography is functional only: calendar, clock, location, players, arrow, Instagram/WhatsApp.
- Motion remains quiet: linked cards lift slightly, images zoom subtly, no carousel or heavy scroll effects.

## Color direction

The color system is derived from the user-provided crest and assigned by purpose, not decoration:

| Token | Direction | Use |
|---|---|---|
| `paper` | warm ivory `#F4F0E8` | primary page background, breathing room, poster surface |
| `paper-raised` | soft cream `#EBE6DC` | cards, inputs, secondary surfaces |
| `ink` | deep blue-black `#142124` | hero fixture, dark sections, primary text on paper |
| `ink-soft` | raised navy `#1D2D2F` | dark cards, footer surfaces |
| `red` | crest red `#D94732` | RSVP, next-show marker, active states, urgent availability |
| `red-soft` | transparent red tint | hover wash, notification background, selected states |
| `field` | muted pitch green `#759A72` | activity strip detail, archive metadata, occasional secondary accent |
| `line` | warm border `#CFC7BA` | dividers and card outlines |

### Color rules

- Red is reserved for action and match urgency; do not use it for every heading or decoration.
- Green is supportive and should not compete with the red CTA.
- Ink sections use ivory text and red action accents; paper sections use ink text and red action accents.
- Body text must use ink or secondary ink, never muted red/green.
- Red on ivory and ivory on ink must remain the primary high-contrast action combinations.
- Use the green only where it communicates field/community context, not as a generic success color.

## Accessibility and responsive rules

- Primary actions have visible labels and keyboard focus states.
- All important fixture information remains visible without hover.
- Poster composition stacks cleanly at mobile width; no horizontal overflow.
- Mobile fixture rows preserve date, title, time, venue, slots, and action.
- Logo uses `object-contain` and never crops the user-provided crest.
- News/gallery image alt text remains meaningful.

## Success criteria

- Pengunjung dapat memahami next match, lokasi, waktu, dan slot dalam layar pertama.
- Pengunjung dapat menuju RSVP dengan satu klik dari homepage.
- Schedule terasa seperti daftar tour dates tetapi tetap berfungsi sebagai daftar fixture.
- News dan Gallery terasa sebagai archive komunitas, bukan section generik.
- Visual memiliki karakter band/community tanpa meniru brand band tertentu.
- `npm test`, `npm run lint`, `npx tsc --noEmit`, dan `npm run build` tetap lulus.
