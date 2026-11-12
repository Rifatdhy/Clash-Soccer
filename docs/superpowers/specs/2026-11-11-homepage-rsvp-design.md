# Clash.Soccer Homepage + RSVP Design

## Intent

Menjadikan homepage Clash.Soccer sebagai pintu masuk komunitas yang aktif dan lokal: pengunjung harus segera memahami pertandingan berikutnya dan dapat menuju RSVP tanpa kebingungan.

## Goals

- Menampilkan next match sebagai informasi dan CTA utama.
- Membuat tanggal, waktu, lokasi, dan slot tersedia mudah dipindai.
- Membawa pengguna dari homepage ke detail pertandingan/RSVP dengan satu aksi yang jelas.
- Menambahkan activity strip yang menjelaskan ritme komunitas: hari bermain, lokasi, level pemain, dan kapasitas.
- Memperkuat voice lokal serta section community tanpa mengorbankan fungsi yang sudah berjalan.
- Memastikan pola fixture dan CTA tetap nyaman dipakai di mobile.

## Non-goals

- Tidak mengubah schema database, API RSVP, autentikasi admin, atau aturan kapasitas.
- Tidak mengganti logo buatan pengguna di `public/logo.png`.
- Tidak melakukan redesign penuh untuk seluruh halaman publik pada tahap ini.
- Tidak menambahkan payment flow, kalender eksternal, atau notifikasi baru.

## Anti-goals

- Homepage tidak boleh menjadi landing page generik dengan CTA abstrak seperti hanya `Learn more`.
- Informasi penting tidak boleh tersembunyi di dalam dekorasi atau card yang sulit dipindai.
- Tidak menambahkan animasi berat atau ornamen yang mengganggu tindakan RSVP.

## Approaches considered

### Homepage-first

Memusatkan perubahan di hero, activity strip, next games, community statement, matchday content, dan how-it-works. Dampak visual cepat dan risiko rendah, tetapi RSVP perlu tetap diperkuat agar redesign menghasilkan tindakan nyata.

### Full public-site redesign

Menyamakan seluruh halaman publik sekaligus. Lebih konsisten, tetapi scope dan risiko regresinya lebih besar sebelum pola homepage tervalidasi.

### RSVP-first

Memusatkan pekerjaan pada flow detail pertandingan hingga konfirmasi. Dampak konversi tinggi, tetapi identitas komunitas dan kualitas entry point tetap kurang kuat.

### Chosen approach

Homepage-first sebagai fondasi, ditambah optimasi RSVP dari RSVP-first. Ini dipilih karena menjawab dua kebutuhan utama: website terasa seperti komunitas yang hidup dan pengunjung dapat segera ikut bermain.

## Proposed experience

```text
Hero
  A weekly football ritual in Depok.
  Next match: date, time, venue, available slots
  Join this game

Activity strip
  Wednesday + Saturday
  Depok
  All levels welcome
  Player capacity

Next games
  Compact fixture rows/cards
  Date, title, time, location, slots
  RSVP/open fixture action

Community statement
  Local, direct copy about why Clash.Soccer exists

Matchday journal
  Latest news and gallery preview using existing content

How to play
  Choose a game → RSVP → Show up
```

## RSVP behavior

- `Join this game` links to the existing match detail/RSVP route for the selected next match.
- Available slots must remain visible before the click.
- Existing validation, rate limiting, capacity locking, and confirmation behavior remain unchanged.
- When there is no upcoming match, the hero should fall back to the existing empty-state pattern and route users to Schedule.
- CTA labels should describe the action (`Join this game`, `RSVP`) rather than generic navigation.

## Visual direction

- Keep the user-provided crest at `public/logo.png`.
- Continue the ivory / ink / red visual system, but prioritize content over decorative grid and circles.
- Use fixture styling inspired by a matchday notice or scorecard.
- Keep icon use functional: calendar, clock, location, players, arrow.
- Use existing images from news/gallery data; do not introduce remote image dependencies.
- Ensure focus states, contrast, tap targets, and responsive wrapping remain accessible.

## Success criteria

- A first-time visitor can identify the next game, location, and available slots without navigating away.
- The primary CTA reaches the correct RSVP path for the displayed match.
- The same information remains readable at mobile width.
- Existing homepage data, RSVP behavior, admin pages, and build remain intact.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
