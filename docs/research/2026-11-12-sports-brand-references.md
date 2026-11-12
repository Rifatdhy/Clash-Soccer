# Referensi Brand Olahraga untuk Clash.Soccer

## Ringkasan

Referensi utama yang berhasil dibaca dari sumber first-party adalah Nike Football. Pola yang paling relevan untuk Clash.Soccer bukan storefront-nya, melainkan cara Nike mengelompokkan pengalaman berdasarkan kebutuhan pemain: boots, nations, athletes, clubs, apparel, accessories, coaching, membership, dan stories.

## Nike Football

Source: https://www.nike.com/gb/football

### Pola yang dapat diambil

- **Campaign-led entry points:** halaman menampilkan campaign dengan headline singkat, visual kuat, dan satu action jelas seperti `Shop`.
- **Segmentasi berdasarkan kebutuhan:** `Boots`, `Nations`, `Athletes`, `Clubs`, `Apparel`, `Accessories`, dan `Coaching` membuat pengguna memilih jalur sesuai intent.
- **Product/context storytelling:** visual dan copy menjelaskan konteks penggunaan, bukan hanya menampilkan daftar produk.
- **Community/membership layer:** Nike menghubungkan football dengan coaching, stories, membership, dan community discounts.
- **Team identity:** bagian `Choose your team` memakai identitas klub/federasi sebagai entry point.

### Terjemahan untuk Clash.Soccer

Ganti kategori produk menjadi kebutuhan pemain:

```text
I want to play       → Schedule / RSVP
I want to see the crew → Gallery / Archive
I want to know the rules → FAQ
I want to stay close → Instagram / WhatsApp
```

Homepage dapat memakai campaign block yang berganti berdasarkan konten nyata:

```text
NEXT GAME
The next kick-off is waiting.
[Join this game]
```

### Warna

Nike menempatkan campaign visual sebagai fokus dan membiarkan action berdiri sendiri. Untuk Clash.Soccer, prinsip ini diterjemahkan menjadi:

- `#D94732` hanya untuk RSVP/active state.
- Ivory dan ink sebagai canvas utama.
- Green hanya untuk field/community metadata.
- Foto pertandingan menjadi visual campaign ketika tersedia.

## Referensi brand olahraga lain

Adidas, PUMA, dan Under Armour merupakan referensi relevan untuk product/campaign art direction, tetapi halaman regionalnya tidak dapat diambil secara stabil pada sesi ini karena response `403`, `404`, atau `418`. Karena itu, tidak ada klaim detail halaman mereka yang dijadikan dasar implementasi.

## Rekomendasi untuk Clash.Soccer

1. **Buat intent navigation, bukan menu datar:** `Play`, `Watch`, `Know`, `Keep up`.
2. **Gunakan campaign block dari data nyata:** next match, latest news, atau latest album.
3. **Jadikan match sebagai product moment:** tanggal, venue, capacity, dan CTA tampil seperti satu campaign unit.
4. **Gunakan foto sebagai proof:** gallery/news menjadi bukti komunitas aktif, bukan dekorasi.
5. **Bangun repeat loop:** selesai RSVP → lihat archive → kembali ke next game.

## Sumber

- Nike Football: https://www.nike.com/gb/football
- Nike Coaching: https://www.nike.com/gb/coaching
- Nike Stories: https://www.nike.com/gb/stories
