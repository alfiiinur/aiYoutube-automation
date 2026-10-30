# Konek Meta Developer: Threads, Instagram, Facebook

Panduan ini menjelaskan cara menghubungkan aplikasi ke Meta agar jadwal publish
terkirim **asli** (bukan simulasi). Satu Meta App tipe **Business** cukup untuk
ketiga platform.

> Tanpa konfigurasi ini aplikasi tetap jalan dalam **mode simulasi**: jadwal
> publish dibuat dan ditandai terkirim, tapi tidak benar-benar diposting.

## 1. Yang perlu disiapkan (checklist)

Serahkan nilai-nilai ini agar bisa saya pasang:

| # | Data | Dari mana |
|---|------|-----------|
| 1 | `META_APP_ID` + `META_APP_SECRET` | Meta App (langkah 2) |
| 2 | **Threads**: username + user ID + access token | Langkah 3 |
| 3 | **Instagram**: akun Bisnis/Kreator tertaut ke Halaman FB + IG user ID + Page access token | Langkah 4 |
| 4 | **Facebook**: Page ID + Page access token | Langkah 5 |

Token yang dipakai adalah **long-lived token** (±60 hari, bisa diperpanjang).
Jangan kirim token lewat chat publik — tempel langsung ke `.env` / halaman Publish.

## 2. Buat Meta App 

1. Buka [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**.
2. Pilih tipe **Business**, isi nama app dan email kontak.
3. Di dashboard app: **App Settings → Basic**, salin:
   - **App ID** → `META_APP_ID`
   - **App Secret** (klik Show) → `META_APP_SECRET`
4. Tambahkan akun kamu sebagai **App Role** (Admin/Developer/Tester) di
   **App Roles → Roles**. Selama akun punya role, API bisa dipakai walau app
   masih mode **Development** (belum perlu App Review untuk akun sendiri).

## 3. Threads

**Syarat:** akun Threads (terhubung ke akun Instagram).

1. Di Meta App, tambahkan **use case / produk Threads API** (ikuti wizard Meta:
   redirect URI + scope). Scope yang dibutuhkan:
   - `threads_basic` (baca profil)
   - `threads_content_publish` (posting)
2. Otorisasi akun kamu dan dapatkan **short-lived token** (cara termudah:
   Graph API Explorer dengan app kamu, atau alur OAuth manual Threads).
3. Tukar ke long-lived token:
   ```bash
   curl "https://graph.threads.net/oauth/access_token?grant_type=th_exchange_token&client_secret=META_APP_SECRET&access_token=SHORT_TOKEN"
   ```
4. Ambil Threads user ID:
   ```bash
   curl "https://graph.threads.net/v1.0/me?fields=id,username&access_token=LONG_TOKEN"
   ```
5. Catat: `username`, `id` (= User ID), dan `LONG_TOKEN` (= access token).

Perpanjangan (±60 hari, sebelum kedaluwarsa):

```bash
curl "https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=LONG_TOKEN"
```

## 4. Instagram (Graph API)

**Syarat:** akun IG **Professional** (Business atau Creator) yang tertaut ke
**Halaman Facebook**. Akun IG pribadi tidak bisa dipakai API.

1. Pastikan IG Bisnis/Kreator tertaut ke Halaman FB
   (FB Page Settings → Linked Accounts / akun IG → Pengaturan → Akun).
2. Buat **user token** dengan scope berikut (Graph API Explorer / Facebook Login):
   - `instagram_basic`, `instagram_content_publish`
   - `pages_show_list`, `pages_read_engagement`
3. Tukar ke long-lived token:
   ```bash
   curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=META_APP_ID&client_secret=META_APP_SECRET&fb_exchange_token=SHORT_TOKEN"
   ```
4. Ambil daftar Halaman + akun IG tertaut:
   ```bash
   curl "https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=LONG_TOKEN"
   ```
5. Catat: `instagram_business_account.id` (= IG User ID) dan Page `access_token`
   (= access token untuk posting IG).

**Catatan posting IG:** endpoint `/media` butuh media untuk format gambar/video.
Posting teks saja saat ini mengikuti alur di `app/lib/publisher.ts`; kalau butuh
format carousel/reels dengan `mediaUrl`, kabari agar alurnya saya sesuaikan.

## 5. Facebook Page

**Syarat:** kamu admin/editor Halaman Facebook.

1. Buat user token dengan scope:
   - `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`
2. Tukar ke long-lived token (perintah sama seperti langkah 4.3).
3. Ambil Page ID + Page access token (perintah sama seperti langkah 4.4).
4. Catat: Page `id` (= Page ID) dan Page `access_token`.

Page access token yang diturunkan dari long-lived user token umumnya tidak
mudah kedaluwarsa; kalau posting gagal dengan error OAuth, ulangi langkah 2–3.

## 6. Pasang ke aplikasi

1. Isi `.env` / `.env.local`:
   ```bash
   META_APP_ID=...
   META_APP_SECRET=...
   META_REDIRECT_URI=https://domain-kamu/api/meta/callback
   ```
   (`META_REDIRECT_URI` boleh kosong untuk sekarang — dipakai saat alur login
   OAuth ditambahkan. Untuk tempel-token manual tidak dibutuhkan.)
2. Restart dev server: `npm run dev`.
3. Buka **Settings** → pastikan baris **Meta** berstatus *terhubung*.
4. Buka **Publish → Akun terhubung** → tambah 1 akun per platform:
   - Platform: Threads / Instagram / Facebook
   - Username, **User ID / Page ID**, dan **access token** dari langkah di atas.
   - Akun berlabel **API siap** = posting berikutnya terkirim asli.

## 7. Verifikasi cepat

- Token Threads valid?
  ```bash
  curl "https://graph.threads.net/v1.0/me?fields=id,username&access_token=TOKEN"
  ```
- Token Page valid + IG tertaut?
  ```bash
  curl "https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=TOKEN"
  ```
- Buat 1 postingan terjadwal untuk "sekarang" di halaman Publish, lalu cek
  kolomnya: `simulated` harus **false** dan ada URL postingan asli.

## 8. Batasan & langkah lanjut

- Token long-lived ±60 hari: jadwalkan refresh (endpoint helper sudah tersedia
  di `app/lib/meta.ts`: `refreshFacebookToken`, `refreshThreadsToken`).
- Untuk akun publik (bukan app role), app harus **Live** + lolos **App Review**
  untuk permission publish.
- Alur **Login with Meta (OAuth)** + tombol **“Hubungkan”** per akun bisa saya
  bangun setelah App ID/Secret tersedia — kabari kalau mau saya lanjutkan.
