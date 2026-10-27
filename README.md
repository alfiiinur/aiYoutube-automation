# Studio AI — YT Automation & Video Generator

Dashboard untuk mengotomatiskan produksi video YouTube/Short: tulis prompt, tempel link referensi (YouTube/Instagram/TikTok/web), lalu sistem menyusun hook, script, storyboard, caption, dan hashtag secara otomatis via pipeline bertahap.

## Fitur
- **Dashboard** — ringkasan pipeline, job terbaru, referensi per platform
- **Generate Video** — prompt + referensi link, pilihan aspect ratio, durasi, gaya, voice, model
- **Referensi** — analisis metadata (YouTube oEmbed resmi + Open Graph) dan penyimpulan pola hook/struktur
- **Job & Render** — daftar job, progress live, script/storyboard/caption, render ulang
- **Automation** — jadwal produksi + upload otomatis (mode simulasi, hook untuk integrasi nyata)
- **Settings** — status koneksi provider berdasarkan environment variable

## Jalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Build produksi

```bash
npm run build
npm start
```

## Konfigurasi provider (opsional)

Buat file `.env.local` di root dan isi:

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
- Data tersimpan di `data/db.json`

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Penyimpanan JSON lokal (tanpa database eksternal)

## Struktur
```
app/
  api/          # route API: jobs, references, automations, stats, settings
  components/   # Sidebar, Card, StatusBadge, ProgressBar, dll.
  lib/          # store JSON, analyzer referensi, generator script
  generate/     # halaman generate video
  references/   # manajemen link referensi
  jobs/         # daftar + detail job
  automations/  # jadwal produksi
  settings/     # status provider
```