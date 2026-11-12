# Clash.Soccer Sports Brand UI System

## Intent

Membangun pengalaman publik Clash.Soccer dengan standar visual dan struktur seperti sports brand besar: homepage sebagai campaign surface, pertandingan sebagai Match Center, Schedule sebagai fixture hub, dan News/Gallery sebagai community media layer.

Sistem ini menggabungkan tiga pendekatan yang sebelumnya dipertimbangkan:

1. **Homepage-first** — campaign hero, visual tile, dan first impression.
2. **Match Center-first** — next match, metadata fixture, CTA RSVP, dan status kapasitas.
3. **Public-site system** — vocabulary, navigation, cards, footer, dan responsive behavior yang konsisten di seluruh public site.

Referensi hanya digunakan untuk pola UI dan hierarchy dari Nike Football, Manchester United, Liverpool FC, dan Arsenal. Tidak ada logo, foto, copy, atau layout spesifik mereka yang disalin.

## Goals

- Membuat homepage terasa seperti sports brand lokal yang aktif.
- Menempatkan Match Center sebagai jalur RSVP yang jelas dan cepat.
- Membuat Schedule menjadi fixture hub yang mudah dipindai.
- Membuat News dan Gallery terasa sebagai media/community layer, bukan halaman tambahan.
- Menambahkan utility CTA `Join next game` pada area navigasi yang sesuai.
- Menyamakan heading, label, card, button, metadata, divider, dan state di seluruh public site.
- Menjaga logo pengguna di `public/logo.png` sebagai identitas utama.
- Mempertahankan seluruh API, database, auth, rate limit, capacity locking, dan route RSVP yang ada.

## Non-goals

- Tidak membuat ticketing, payment, membership backend, calendar sync, atau mobile app.
- Tidak menambahkan sponsor grid jika belum ada sponsor nyata.
- Tidak menambahkan filter yang tidak didukung oleh data existing.
- Tidak meniru identitas atau layout spesifik brand referensi.
- Tidak mengubah schema database atau kontrak API.

## Approach

### Unified system, phased delivery

Semua opsi diterapkan dalam satu sistem, tetapi dikerjakan melalui tiga lapisan:

```text
Layer 1 — Campaign surface
  Homepage hero
  Campaign tiles
  Community/visual sections

Layer 2 — Match conversion
  Match Center
  Schedule / fixture hub
  RSVP CTA and capacity states

Layer 3 — Club ecosystem
  News
  Gallery
  FAQ
  Contact
  Navigation and footer
```

Layer 1 dan Layer 2 menjadi prioritas pertama karena paling langsung memengaruhi first impression dan RSVP. Layer 3 memakai primitive visual yang sama agar seluruh website terasa sebagai satu brand.

## Information architecture

### Primary navigation

```text
Home
Schedule
News
Gallery
FAQ
Contact
```

### Utility actions

```text
Join next game
Instagram
WhatsApp / Contact
```

`Join next game` hanya muncul sebagai prominent action jika upcoming match tersedia. Jika tidak ada match, action fallback menuju `/schedule`.

## Homepage design

### Hero campaign

```text
WEEKLY FOOTBALL · DEPOK

The game
is better
together.

NEXT MATCH
Latihan Rutin Rabu
Depok Mini Soccer
Wednesday · 20:00 WIB
17 spots left

[JOIN THIS GAME]
```

Rules:

- Satu primary CTA.
- Match information terlihat tanpa hover.
- Hero menggunakan data next match nyata.
- Jika tidak ada match, tampilkan empty state jujur dan CTA ke Schedule.

### Campaign tiles

Gunakan visual-first card untuk konten yang memang tersedia:

```text
FROM THE PITCH
Latest news item
[Read story]

THE CLASH ARCHIVE
Latest gallery album
[Open archive]
```

Tidak membuat campaign content palsu saat data kosong.

## Match Center design

Match Center adalah unit paling penting untuk RSVP.

```text
NEXT GAME

20 NOV
WEDNESDAY

CLASH SESSION
Weekly Friendly

DEPOK MINI SOCCER
20:00 WIB
17 / 18 PLAYERS

[JOIN THIS GAME]
```

### Match states

| State | Label | CTA |
|---|---|---|
| Upcoming with availability | `spots left` | `Join this game` |
| Full | `Fully booked` | `View fixture` |
| Past | `Past game` | `View result` atau existing detail action |
| No upcoming match | `No next game yet` | `See schedule` |

Tidak ada perubahan pada capacity rules atau RSVP validation.

## Schedule / fixture hub

Schedule menggunakan pola fixture list sports brand:

```text
UPCOMING GAMES
Tour dates

20 NOV · WED
Weekly Friendly
Depok Mini Soccer
20:00 WIB · 17 spots left
[JOIN THIS GAME]
```

Past matches diposisikan sebagai archive dan tidak menampilkan CTA seolah-olah masih dapat RSVP.

## Editorial system

### News

```text
FROM THE PITCH

[Image]
MATCHDAY · 2 DAYS AGO
Headline berita
Read story →
```

### Gallery

```text
THE CLASH ARCHIVE

[Image tile]
Matchday album
Open archive →
```

Image fallback existing tetap digunakan. Alt text harus tetap bermakna.

## UI primitives

- `Eyebrow`: uppercase condensed, tracking lebar.
- `Display heading`: serif/display besar untuk campaign dan match title.
- `Metadata`: condensed sans untuk date, time, location, capacity.
- `Primary CTA`: red, solid, label pendek, focus state jelas.
- `Secondary CTA`: ink/paper outline atau text arrow.
- `Match card`: status, date, title, venue, time, capacity, action.
- `Editorial card`: image, category, date, title, action.
- `Utility strip`: action cepat dan community links.
- `Section label`: konsisten di seluruh public page.

## Color system

| Token | Value | Purpose |
|---|---|---|
| Paper | `#F4F0E8` | page canvas |
| Paper raised | `#EBE6DC` | card/input surface |
| Ink | `#142124` | primary text and dark blocks |
| Ink soft | `#1D2D2F` | footer and raised dark surfaces |
| Crest red | `#D94732` | primary CTA and match urgency |
| Red soft | `rgba(217, 71, 50, 0.16)` | selected/hover states |
| Field green | `#759A72` | secondary field/community accent |
| Line | `#CFC7BA` | borders and dividers |

Red must not be used for every heading. Green must not imply success unless it represents a real status. Body text uses ink/secondary ink or ivory on dark surfaces.

## Responsive behavior

- Desktop: campaign hero can use split layout with visual Match Center.
- Tablet: hero and Match Center reduce gap without losing metadata.
- Mobile: all fixture data stacks; date remains visually prominent; CTA becomes full-width or large tap target.
- No horizontal scrolling for cards, navigation, or fixture metadata.
- Utility CTA remains reachable without competing with the logo.

## Accessibility

- All CTAs have explicit labels.
- Focus states are visible.
- Interactive cards have keyboard-accessible links/buttons.
- Color is never the only indicator of capacity or state.
- Image alt text remains meaningful.
- Motion is subtle and respects reduced-motion preferences.

## High-impact UI/UX additions

UI/UX additions are selected by their effect on user decisions and task completion, not by visual novelty.

### 1. Persistent next-game action

- Desktop: utility CTA `Join next game` remains visible in the header when an upcoming match exists.
- Mobile: show a bottom action bar only after the user scrolls past the hero Match Center, with the next match name and one `Join` action.
- The bar must not cover form inputs, cookie notices, or the footer; use safe-area padding on supported mobile devices.
- If no upcoming match exists, the action becomes `See schedule`.

### 2. Match Center decision hierarchy

Each Match Center must answer in this order:

```text
What is it? → When is it? → Where is it? → Can I join? → What do I do next?
```

- Use a visible status badge (`Next game`, `Fully booked`, or `Past game`).
- Treat available capacity as a progress signal (`17 of 18 spots`) with text, not color alone.
- Keep the CTA adjacent to capacity so the action is understood at scan speed.
- Use a compact details row for date/time/location and make the full fixture card keyboard-accessible.

### 3. Schedule scan controls

- Add a lightweight `Upcoming` / `Archive` control that preserves the existing data and route behavior.
- Keep the selected state visible with text and a high-contrast indicator, not color alone.
- On mobile, use a full-width segmented control with tap targets at least 44px high.
- Do not add filters until the underlying data supports them accurately.

### 4. RSVP confidence cues

Before the user enters RSVP:

- Show exact date, time, location, remaining spots, and what to bring if existing content supports it.
- Show a short three-step cue: `Choose a game → RSVP → Show up`.
- Use `Join this game` for an available fixture and never imply availability for a full fixture.

During/after RSVP, preserve the existing validation and confirmation behavior but improve presentation of:

- loading state: `Reserving your spot…`
- success state: `You’re on the list.`
- capacity conflict: `That spot was just taken. Choose another game.`
- rate-limit/error state: plain-language recovery action and retry guidance.

### 5. Editorial interaction affordances

- News and Gallery cards show their whole-card link behavior through a visible arrow/action.
- Image cards use a consistent aspect ratio and meaningful fallback when media is absent.
- Latest content receives a small `New` or date marker only when the data supports it; no invented freshness claims.

### 6. Navigation and feedback

- Mark the current primary navigation item with text/underline plus a non-color cue.
- Keep `Join next game` visually stronger than secondary social links, but do not make it compete with the logo.
- Preserve focus rings, skip link, readable error states, and reduced-motion behavior.

### High-impact success signals

- A user can find and activate the next-game action from desktop header or mobile sticky action without returning to the top.
- A user can determine availability without opening the fixture detail.
- A user can switch Upcoming/Archive on mobile without accidental taps.
- Full, empty, loading, validation, and capacity-conflict states explain what happened and what to do next.
- No new interaction hides existing data or changes RSVP backend behavior.

## Success criteria

- Pengunjung memahami next match, venue, time, capacity, dan CTA dalam satu viewport.
- RSVP dapat dicapai dari homepage melalui satu klik.
- Schedule dapat dipindai seperti fixture hub.
- News/Gallery memiliki hierarchy editorial yang jelas.
- Semua public pages memakai vocabulary dan primitives yang konsisten.
- Mobile tidak overflow dan tetap nyaman disentuh.
- `npm test`, `npm run lint`, `npx tsc --noEmit`, dan `npm run build` tetap lulus.
