# Syarat Automation Upload (End-to-End)

Dokumen ini merinci **apa saja yang dibutuhkan** agar automation benar-benar
mengunggah — bukan simulasi. Terbagi dua: yang tinggal konfigurasi (kode sudah
ada) dan yang harus dibangun (kode belum ada).

> Status kode saat tulisan ini dibuat: autopost Threads/Instagram/Facebook
> sudah punya jalur API asli; upload YouTube/TikTok dan render video masih
> simulasi. Jadwal (automation + autopost terjadwal) hanya berjalan saat
> `/api/cron` dipanggil.

## 0. Cara kerja scheduler (wajib paham dulu)

| Pemicu | Yang dijalankan | Keterangan |
|--------|-----------------|------------|
| `GET /api/cron` | `syncJobs` + `publishDuePosts` + `runDueAutomations` | Satu-satunya pemicu automation terjadwal |
| `GET /api/posts` | `publishDuePosts` dulu, lalu daftar post | Halaman Publish me-refresh tiap 5 detik, jadi autopost terjadwal terkirim sendiri |
| `npm run telegram:poll` | polling bot + memanggil `/api/cron` tiap putaran | Opsi ticker termudah di lokal |
| Tombol "Jalankan sekarang" | `runAutomation` sekali jalan | Manual, tanpa cron |

Implikasinya: **tanpa ticker cron, automation terjadwal tidak akan pernah
jalan sendiri** (halaman Automation hanya menampilkan daftar). Lihat Fase B.

## Fase A — Autopost asli ke Threads / Instagram / Facebook (konfigurasi)

Kode publisher sudah jadi (`app/lib/publisher.ts`). Yang kurang hanya kredensial.

### A.1 Meta App (satu app untuk 3 platform)

1. Buka developers.facebook.com → My Apps → Create App → tipe **Business**.
2. Catat **App ID** → `META_APP_ID`, **App Secret** → `META_APP_SECRET` di `.env`.
3. Tambahkan akunmu sebagai App Role (Admin/Developer). Selama ber-role, API
   bisa dipakai walau app masih mode Development (tanpa App Review untuk akun
   sendiri).
4. Restart dev server setelah mengisi `.env`.

### A.2 Token + ID per platform (ditempel manual)

| Platform | Syarat akun | Yang ditempel di Publish → Akun terhubung |
|----------|-------------|-------------------------------------------|
| Threads | Akun Threads + scope `threads_basic`, `threads_content_publish` | username, Threads user ID, long-lived token |
| Instagram | Akun **Bisnis/Kreator** tertaut ke **Halaman FB** + scope `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement` | username, IG User ID (`instagram_business_account.id`), Page access token |
| Facebook | Admin/editor Halaman + scope `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` | nama Halaman, Page ID, Page access token |

Langkah perintah `curl`-nya ada di [meta-setup.md](./meta-setup.md) (tukar
short-lived → long-lived token, ambil ID, verifikasi token).

Akun berlabel **API siap** = postingan berikutnya terkirim asli
(`simulated: false` + URL postingan nyata).

### A.3 URL publik (wajib untuk video/gambar asli)

Graph API hanya mau URL media publik. Aplikasi menyusunnya dari:

```
NEXT_PUBLIC_APP_URL || TELEGRAM_PUBLIC_URL || https://$VERCEL_URL
```

- Posting **teks** (Threads/FB): bisa tanpa URL publik.
- Posting **video/gambar**: tanpa salah satu variabel di atas, publish gagal
  dengan pesan jelas. Localhost tidak bisa — butuh deploy atau tunnel
  (ngrok/Cloudflare) saat development.
- Format yang didukung: video MP4/MOV (IG = Reels), gambar JPG/PNG.

### A.4 Perawatan token

- Long-lived token ±60 hari → refresh sebelum kedaluwarsa. Helper sudah ada:
  `refreshFacebookToken` / `refreshThreadsToken` di `app/lib/meta.ts`.
- Kalau posting gagal dengan error OAuth → ulangi tukar token (langkah A.2).
- Untuk akun publik (di luar app role): app harus Live + lolos App Review
  untuk permission publish.
- Belum ada: alur Login with Meta (OAuth) + tombol "Hubungkan" — masih
  tempel-token manual (bisa dibangun setelah App ID/Secret ada).

## Fase B — Ticker cron (automation jalan sendiri)

Pilih **salah satu**:

### Opsi 1 — Telegram poll (termudah, sekalian notifikasi)

```bash
npm run telegram:poll
```

- Butuh `TELEGRAM_BOT_TOKEN` (+ `TELEGRAM_CHAT_ID` untuk notifikasi).
- Polling jalan dari localhost (tidak butuh URL publik; URL publik hanya
  untuk mode webhook).
- Bonus: notifikasi otomatis saat render selesai / postingan terkirim/gagal,
  plus perintah `/generate`, `/jobs`, `/posts` dari Telegram.

### Opsi 2 — Cron eksternal

Panggil tiap 1 menit:

```bash
curl http://localhost:3000/api/cron
```

- Windows: Task Scheduler; Linux: `* * * * * curl ...`; atau layanan gratis
  (UptimeRobot/cron-job.org) kalau sudah deploy.
- Kalau `CRON_SECRET` diisi, wajib header `Authorization: Bearer <CRON_SECRET>`.
- Respons: `{ ok, jobs, posts, automations }` = jumlah item yang diproses
  tick tersebut.

### Verifikasi Fase A+B

1. Buat automation platform Threads/Instagram/Facebook → "Jalankan sekarang" →
   job muncul di Jobs + postingan muncul di Auto Post (`simulated: false`).
2. Buat postingan terjadwal 2 menit ke depan → tunggu → status jadi `sent`
   tanpa disentuh.
3. Atur automation `every:...` pendek → tunggu 1–2 tick cron → `runs`
   bertambah dan `nextRunAt` maju.

## Fase C — Upload asli ke YouTube (kode belum ada)

Variabel `YOUTUBE_*` di `.env` saat ini **hanya dipakai indikator Settings**,
belum ada kode upload. Yang dibutuhkan:

### C.1 Akun & kredensial Google

1. Google Cloud project → aktifkan **YouTube Data API v3**.
2. Buat OAuth client (Desktop atau Web) → `YOUTUBE_CLIENT_ID`,
   `YOUTUBE_CLIENT_SECRET`.
3. Lewati OAuth consent satu kali dengan scope
   `https://www.googleapis.com/auth/youtube.upload` → simpan
   `YOUTUBE_REFRESH_TOKEN` (server memakai refresh token, bukan login
   interaktif).
4. Perhatikan **kuota API**: upload 1 video ≈ 1600 unit; kuota default
   10.000 unit/hari (≈6 video/hari) kecuali diajukan naik.
5. Channel baru/unverified punya batas (upload harian, durasi) — verifikasi
   channel via youtube.com/verify.

### C.2 Kode yang harus dibangun

- Resumable upload ke `youtube:videos.insert` (video bisa ratusan MB —
  ikuti pola endpoint `/upload` yang lolos middleware, bukan `/api/*`).
- Mapping metadata: judul, deskripsi (caption + hashtag), privacy
  (`public`/`unlisted`/`private` — kolomnya sudah ada di Automation),
  `madeForKids`, kategori.
- Penanganan error kuota/hak akses + retry, dan simpan URL video hasil
  upload ke job/postingan.
- Refresh token otomatis saat access token kedaluwarsa.

### C.3 Syarat file

- File MP4 (H.264 + AAC) ≤ 256 GB, durasi sesuai batas channel.
- File harus **sudah ada** sebelum upload — lihat Fase E (render) atau pakai
  stock video sendiri (fitur Stock sudah jadi).

## Fase D — Upload asli ke TikTok (kode belum ada)

Belum ada kode maupun slot env. Yang dibutuhkan:

### D.1 Aplikasi TikTok Developer

1. Daftar di developers.tiktok.com → buat app → ajukan scope posting
   (**Content Posting API**: `video.upload`, `video.publish`).
2. TikTok mewajibkan **review/audit aplikasi** sebelum API posting bisa
   dipakai akun umum; siapkan demo video + deskripsi use case.
3. OAuth per akun kreator → simpan access + refresh token per akun
   (pola penyimpanan mengikuti tabel `SocialAccount`).

### D.2 Kode yang harus dibangun

- Alur 3 langkah TikTok: init upload → kirim chunk video → publish
  (`FILE_UPLOAD` langsung atau `PULL_FROM_URL` dari URL publik).
- Batasan TikTok: MP4/WebM/MOV, umumnya ≤10 menit untuk upload API,
  ukuran dibatasi per endpoint — cek dokumentasi terbaru saat implementasi.
- Simpan ID video + status publish; TikTok memproses async (perlu polling
  status seperti yang sudah ada untuk IG di `publisher.ts`).

### D.3 Syarat file

Sama seperti YouTube: file jadi wajib ada (Fase E atau stock sendiri).

## Fase E — Render video asli (saat ini simulasi)

Pipeline job saat ini (`syncJobs` + `generateJobContent`) membuat
judul/hook/script/caption dari template lokal dan memajukan status pakai
timer — **tidak ada file MP4 yang dihasilkan**. Ini proyek terbesar.

### E.1 Yang sudah setengah jalan (tinggal isi key)

| Komponen | Status | Key |
|----------|--------|-----|
| TTS / voice-over | `/api/tts` otomatis pakai ElevenLabs, fallback OpenAI TTS | `ELEVENLABS_API_KEY` / `OPENAI_API_KEY` |
| Ide prompt, AI planner, saran dashboard | Otomatis pakai OpenAI bila ada key, kalau tidak pakai peracik lokal | `OPENAI_API_KEY` (+ opsional `OPENAI_BASE_URL`, `OPENAI_MODEL`) |
| Stock video sendiri | Sudah jadi (folder + upload ≤250 MB + picker) | — |

### E.2 Yang harus dibangun (pilih satu jalur)

- **Jalur provider (cepat):** sambungkan layanan render API
  (mis. Creatomate / Shotstack / JSON2Video) — slot `RENDER_API_KEY` sudah
  disiapkan di `.env`. Job `rendering` memanggil API → simpan URL/file hasil.
- **Jalur lokal (kontrol penuh):** render dengan ffmpeg/Remotion di server:
  gabung voice-over (E.1) + visual (stock/templated) + caption terbakar →
  MP4 final ke `data/uploads` (atau storage).
- Keduanya butuh: kolom URL/file hasil di `VideoJob`, status gagal render
  yang jelas, dan retry.

### E.3 Jalan pintas yang realistis

Kalau tujuanmu upload rutin (bukan video generatif penuh): **lewati render
otomatis** — upload stock videomu ke pustaka Stock, lalu automation
YouTube/TikTok (Fase C/D) mengambil file dari sana. Ini memangkas 80% kerja.

## Referensi env (lihat `.env.example`)

| Variabel | Wajib untuk | Status kode |
|----------|-------------|-------------|
| `DATABASE_URL` | Semua (PostgreSQL) | Dipakai |
| `SESSION_SECRET` | Login (wajib 32+ char di produksi) | Dipakai |
| `CRON_SECRET` | Amankan `/api/cron` | Dipakai |
| `TELEGRAM_BOT_TOKEN` | Bot + ticker cron + notifikasi | Dipakai |
| `TELEGRAM_CHAT_ID` / `TELEGRAM_ALLOWED_CHAT_IDS` | Tujuan notifikasi | Dipakai |
| `TELEGRAM_PUBLIC_URL` | Webhook + fallback URL media | Dipakai |
| `TELEGRAM_WEBHOOK_SECRET` | Amankan webhook | Dipakai |
| `NEXT_PUBLIC_APP_URL` | URL publik media (Meta) | Dipakai |
| `META_APP_ID` / `META_APP_SECRET` | Autopost asli | Dipakai (validasi cfg) |
| `META_REDIRECT_URI` | OAuth Meta (belum dibangun) | Slot saja |
| `OPENAI_API_KEY` (+ `OPENAI_BASE_URL`, `OPENAI_MODEL`) | AI teks + TTS fallback | Dipakai |
| `ELEVENLABS_API_KEY` | TTS utama | Dipakai |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REFRESH_TOKEN` | Upload YouTube | Slot saja |
| `RENDER_API_KEY` | Render video via provider | Slot saja |

## Urutan yang disarankan

1. **Fase B** (ticker cron) — gratis, hitungan menit; semua jadwal hidup.
2. **Fase A** (token Meta) — autopost IG/Threads/FB jadi nyata.
3. **Fase C atau D** (satu platform dulu, disarankan YouTube) dengan sumber
   file = **stock sendiri** — automation upload pertama yang nyata.
4. **Fase E** (render) — terakhir, hanya kalau butuh video generatif penuh.

## Catatan teknis penting

- **Batas upload aplikasi: 250 MB/file** (`app/lib/upload-limits.ts`).
  File lebih besar ditolak seketika (413) sebelum dibaca server.
- **Jangan taruh endpoint upload di `/api/*`**: request yang lewat
  middleware terpotong di 10 MiB. Endpoint upload file besar wajib di luar
  matcher middleware (pola: `/upload`, `/upload/stock`) dengan cek sesi di
  dalam route bila butuh auth.
- Token Meta dan token TikTok/YouTube semuanya butuh strategi refresh;
  pola refresh Meta sudah ada di `app/lib/meta.ts` dan bisa ditiru.
- Jalankan `npm run db:migrate` setiap habis pull — error `P2022` (kolom
  tidak ada) hampir selalu berarti migrasi belum diterapkan.
