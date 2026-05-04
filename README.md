# POSYANDU APP Desa Brangkal Kecamatan Sooko Kabupaten Mojokerto

Aplikasi pemantauan kesehatan balita desa berbasis `Node.js + Express + MySQL + Vue 3 + Vite + Tailwind CSS`, dengan fokus pemantauan pertumbuhan balita dan deteksi risiko stunting berbasis fondasi logika KMS Indonesia.

## Fitur utama

- Auth JWT: login, logout, refresh token, ubah password
- RBAC: role + permission fleksibel
- Master data: desa, dusun, RW, RT, posyandu, keluarga, intervensi, imunisasi
- Data balita lengkap + QR unik + kartu posyandu printable
- Pemeriksaan posyandu sebagai histori
- Service logika pertumbuhan terpisah untuk tren naik/tetap/turun dan risiko
- Referensi KMS per gender (`L/P`) dengan tabel bulanan `0-59 bulan` + garis batas `-1SD/-2SD` yang mudah di-maintain
- Dashboard untuk kepala desa, petugas/kader, dan admin
- Laporan JSON / CSV / XLSX / PDF
- UI utility-first dengan Tailwind CSS untuk tracking komponen yang lebih mudah
- Public card view untuk orang tua saat scan kartu, termasuk pilihan histori `1 / 2 / 3 / 5 tahun / semua`

## Stack

### Backend

- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT auth
- Zod validation
- RBAC

### Frontend

- Vue 3
- Vite
- Tailwind CSS
- Vue Router
- Pinia
- html5-qrcode
- qrcode
- Chart.js

## Struktur project

```text
KMS/
├── backend/
│   ├── prisma/
│   │   ├── migrations/20260421_init/migration.sql
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   ├── balita/
│   │   │   ├── checkups/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── qrcode/
│   │   │   ├── cards/
│   │   │   ├── scan/
│   │   │   ├── master-data/
│   │   │   ├── families/
│   │   │   ├── posyandu/
│   │   │   └── audit/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── charts/
│   │   │   ├── forms/
│   │   │   └── qr/
│   │   ├── layouts/
│   │   ├── router/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   └── views/
│   └── package.json
└── README.md
```

## Database schema inti

Tabel/model utama:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `villages`
- `hamlets`
- `rws`
- `rts`
- `posyandus`
- `families`
- `mothers`
- `fathers`
- `toddlers`
- `toddler_cards`
- `checkups`
- `checkup_interventions`
- `immunizations`
- `toddler_immunizations`
- `growth_status_logs`
- `audit_logs`

File schema lengkap:

- [backend/prisma/schema.prisma](/Users/alipmac/KMS/backend/prisma/schema.prisma)
- [backend/prisma/migrations/20260421_init/migration.sql](/Users/alipmac/KMS/backend/prisma/migrations/20260421_init/migration.sql)

## Akun default

- Admin: `admin@posyandu.local` / `password123`
- Kepala Desa: `kades@posyandu.local` / `password123`
- Petugas Kesehatan: `petugas@posyandu.local` / `password123`
- Kader Posyandu: `kader@posyandu.local` / `password123`
- Operator Desa: `operator@posyandu.local` / `password123`
- Viewer: `viewer@posyandu.local` / `password123`

## Data seed

Seeder membuat:

- 110 balita
- keluarga terkait
- data ibu dan ayah
- 4 dusun
- RW / RT
- posyandu per dusun
- histori pemeriksaan 2-10 kali per balita
- status campuran `normal`, `perlu perhatian`, `risiko stunting`, `gizi kurang`

## Setup

### 1. Siapkan MySQL

Buat database:

```sql
CREATE DATABASE posyandu_kms;
```

### 2. Atur environment

Salin dan sesuaikan:

- [backend/.env.example](/Users/alipmac/KMS/backend/.env.example)
- [frontend/.env.example](/Users/alipmac/KMS/frontend/.env.example)

### 3. Install dependency

```bash
npm run install:all
```

### 4. Generate Prisma client + migrate

```bash
npm run prisma:generate
npm run prisma:migrate
```

Atau jika ingin memakai SQL migration yang sudah dibuat, jalankan isi file `backend/prisma/migrations/20260421_init/migration.sql` ke database MySQL lalu tetap jalankan `npm run prisma:generate`.

### 5. Jalankan seed

```bash
npm run seed
```

Jika ingin menghitung ulang seluruh histori pemeriksaan dengan logika KMS terbaru (misalnya setelah update referensi):

```bash
npm run recalculate:growth
```

### 6. Jalankan aplikasi

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:frontend
```

Untuk mode paling stabil (single origin, mudah tracking), backend bisa langsung menyajikan build frontend statis di:

`http://localhost:8787`

## Deploy Hostinger Tanpa Terminal hPanel

Jika paket hosting Anda tidak menyediakan terminal, gunakan menu Node.js App + Git deployment.

1. Pastikan branch `main` terbaru sudah ter-pull dari repo.
2. Di konfigurasi build command isi:

```bash
npm run hostinger:build
```

3. Start command:

```bash
npm run start
```

4. Node version: gunakan `20.x` (lebih stabil untuk runtime Prisma di shared hosting).
5. Set environment variable minimal:
   - `DATABASE_URL` (atau kombinasi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRES_IN=24h`
   - `JWT_REFRESH_EXPIRES_IN=360d`
   - `NODE_ENV=production`
   - `APP_PUBLIC_BASE_URL=https://posyandu.online`
   - `CORS_ORIGIN=https://posyandu.online,https://www.posyandu.online`

Catatan: folder `frontend/dist` sudah ikut di-repo, jadi frontend tidak wajib di-build terpisah di server.

## Cara mencoba

### Login

Masuk lewat `http://localhost:8787/login` menggunakan salah satu akun default.

### Scan QR internal

1. Buka halaman `Scan QR`
2. Scan kartu posyandu dari kamera smartphone / webcam
3. Sistem akan resolve QR dan membuka detail balita

### Kartu orang tua

1. Buka detail balita
2. Masuk ke halaman `Kartu Posyandu`
3. QR pada kartu mengarah ke public view
4. Saat orang tua scan lewat smartphone, halaman public akan tampil dan histori tumbuh kembang bisa difilter `1 / 2 / 3 / 5 tahun / semua`

## Halaman yang sudah siap

- Login
- Dashboard
- Data Balita
- Tambah Balita
- Detail Balita
- Edit Balita
- Riwayat Pemeriksaan
- Input Pemeriksaan
- Scan QR
- Kartu Posyandu
- Laporan
- Manajemen User
- Role & Permission
- Profil User
- Pengaturan Aplikasi
- Public Card Orang Tua
- Not Found

## Endpoint utama

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/roles`
- `PUT /api/roles/:id/permissions`
- `GET /api/permissions`
- `GET /api/toddlers`
- `POST /api/toddlers`
- `GET /api/toddlers/:id`
- `PUT /api/toddlers/:id`
- `DELETE /api/toddlers/:id`
- `GET /api/toddlers/:id/checkups`
- `POST /api/toddlers/:id/checkups`
- `PUT /api/checkups/:id`
- `DELETE /api/checkups/:id`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/risk`
- `GET /api/reports/toddlers`
- `GET /api/reports/checkups`
- `GET /api/reports/risk`
- `GET /api/cards/:id`
- `GET /api/cards/public/:token`
- `GET /api/qrcode/:id`
- `POST /api/scan/resolve`

## File penting

- Backend app: [backend/src/app.js](/Users/alipmac/KMS/backend/src/app.js)
- Backend routes: [backend/src/routes/index.js](/Users/alipmac/KMS/backend/src/routes/index.js)
- Growth logic KMS: [backend/src/services/growth.service.js](/Users/alipmac/KMS/backend/src/services/growth.service.js)
- Referensi KMS gender: [backend/src/config/kms-reference.js](/Users/alipmac/KMS/backend/src/config/kms-reference.js)
- Data referensi KMS (mudah di-maintain): [backend/src/config/kms-who-reference.data.js](/Users/alipmac/KMS/backend/src/config/kms-who-reference.data.js)
- Seeder: [backend/prisma/seed.js](/Users/alipmac/KMS/backend/prisma/seed.js)
- Frontend router: [frontend/src/router/index.ts](/Users/alipmac/KMS/frontend/src/router/index.ts)
- Main layout: [frontend/src/layouts/MainLayout.vue](/Users/alipmac/KMS/frontend/src/layouts/MainLayout.vue)
- Dashboard page: [frontend/src/views/DashboardView.vue](/Users/alipmac/KMS/frontend/src/views/DashboardView.vue)
- Public card orang tua: [frontend/src/views/PublicCardView.vue](/Users/alipmac/KMS/frontend/src/views/PublicCardView.vue)

## Verifikasi yang sudah dijalankan

- `npx prisma validate`
- `npx prisma generate`
- import backend app berhasil
- `npm run build` frontend berhasil

Catatan:

- Backend belum saya jalankan penuh ke MySQL karena workspace ini tidak menyediakan server MySQL aktif.
- Setelah MySQL lokal Anda tersedia dan `.env` disesuaikan, alur migrate + seed + login siap dipakai.
