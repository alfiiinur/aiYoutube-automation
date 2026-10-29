# Studio AI — YT Automation & Video Generator

Dashboard untuk mengotomatiskan produksi video YouTube/Short: tulis prompt, tempel link referensi (YouTube/Instagram/TikTok/web), lalu sistem menyusun hook, script, storyboard, caption, dan hashtag secara otomatis via pipeline bertahap.

## Fitur
- **Dashboard** — ringkasan pipeline, job terbaru, referensi per platform
- **Generate Video** — prompt + referensi link, pilihan aspect ratio, durasi, gaya, voice, model
- **Referensi** — analisis metadata (YouTube oEmbed resmi + Open Graph) dan penyimpulan pola hook/struktur
- **Job & Render** — daftar job, progress live, script/storyboard/caption, render ulang
- **Editor** — timeline klip, caption, overlay, musik, dan chat editor
- **Auto Post** — akun Threads/Instagram/Facebook + jadwal tayang
- **Automation** — jadwal produksi + upload otomatis (mode simulasi, hook untuk integrasi nyata)
- **Settings** — status koneksi provider berdasarkan environment variable

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma ORM

## Jalankan

### 1. Siapkan PostgreSQL

Pakai Docker (paling cepat):

```bash
docker compose up -d
```

Atau pakai Postgres/Supabase/Neon yang sudah ada, lalu isi `DATABASE_URL` di `.env`.

```bash
cp .env.example .env
# edit DATABASE_URL
```

### 2. Install & migrasi

```bash
npm install
npm run db:migrate   # buat tabel dari prisma/schema.prisma
npm run db:seed      # opsional: impor data lama dari data/db.json
npm run dev
```

Buka http://localhost:3000

## Build produksi

```bash
npm run build
npm start
```

Saat deploy (Vercel/Railway/Fly), set `DATABASE_URL`, lalu jalankan:

```bash
npm run db:deploy
```

`postinstall` otomatis menjalankan `prisma generate`.

## Perintah database

| Perintah | Fungsi |
| --- | --- |
| `npm run db:migrate` | Buat/terapkan migrasi baru saat development |
| `npm run db:deploy` | Terapkan migrasi di production |
| `npm run db:push` | Sinkronkan schema tanpa file migrasi |
| `npm run db:seed` | Impor `data/db.json` (tambahkan `-- --force` untuk menimpa) |
| `npm run db:studio` | Buka Prisma Studio |
| `npm run db:reset` | Hapus & buat ulang database + seed |

## Konfigurasi provider (opsional)

Isi di `.env` / `.env.local`:

```
OPENAI_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
RENDER_API_KEY=
ELEVENLABS_API_KEY=
```

Tanpa kunci tersebut, aplikasi tetap berjalan dalam **mode simulasi**:
- Generator script/storyboard aktif penuh (heuristik lokal)
- Render & upload disimulasikan
- Metadata & antrean tersimpan di PostgreSQL; file upload tetap di `data/uploads/`

## Integrasi Telegram

Web dan bot memakai database yang sama, jadi job yang dibuat dari chat langsung muncul di dashboard.

### Setup

1. Buat bot lewat [@BotFather](https://t.me/BotFather), salin token.
2. Isi `.env`:

```
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=
TELEGRAM_ALLOWED_CHAT_IDS=
TELEGRAM_PUBLIC_URL=https://app.example.com
TELEGRAM_WEBHOOK_SECRET=rahasia-acak
CRON_SECRET=rahasia-cron
```

3. Jalankan dev server, lalu kirim `/id` ke bot dan isi `TELEGRAM_CHAT_ID` dengan angka tersebut.
4. Pilih mode koneksi:

```bash
# Lokal (tanpa URL publik) — long polling
npm run telegram:poll

# Produksi — daftarkan webhook HTTPS
npm run telegram:setup
```

### Perintah bot

| Perintah | Fungsi |
| --- | --- |
| `/generate <prompt>` | Buat job video (opsi: `--ratio 9:16 --dur 45 --style cinematic --voice female-id`) |
| `/jobs` | 6 job terakhir + tombol detail |
| `/job <id>` | Detail job (tanpa id = terbaru) |
| `/status` | Ringkasan dashboard |
| `/posts` | Jadwal posting terbaru |
| `/ref <url>` | Tambah referensi YouTube/IG/TikTok |
| `/id` | Lihat chat ID |
| `/help` | Bantuan |

Notifikasi otomatis dikirim saat render selesai atau postingan terkirim/gagal. Pipeline disinkronkan oleh polling web, `npm run telegram:poll`, atau endpoint `GET /api/cron` (sertakan `Authorization: Bearer <CRON_SECRET>` bila diset).

## Struktur

```
app/
  api/          # route API: jobs, references, automations, posts, stats, settings
  components/   # Sidebar, Card, StatusBadge, ProgressBar, dll.
  lib/
    db.ts       # Prisma client + mapper row <-> tipe aplikasi
    store.ts    # helper id + simulasi progress pipeline
    jobs.ts     # createJob + sinkronisasi status & notifikasi
    stats.ts    # agregasi dashboard
    telegram.ts # Bot API + format pesan
  generate/     # halaman generate video
  references/   # manajemen link referensi
  jobs/         # daftar + detail job + editor
  publish/      # auto post & jadwal
  automations/  # jadwal produksi
prisma/
  schema.prisma # model PostgreSQL
  seed.mjs      # impor data dari data/db.json
```
