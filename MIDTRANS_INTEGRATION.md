# Integrasi Midtrans Snap - CallExpert

Dokumentasi lengkap untuk integrasi payment gateway Midtrans Snap dengan CallExpert (React + Supabase).

## 📋 Daftar Isi

- [Arsitektur](#arsitektur)
- [Setup Awal](#setup-awal)
- [Konfigurasi Database](#konfigurasi-database)
- [Deploy Edge Functions](#deploy-edge-functions)
- [Konfigurasi Midtrans Dashboard](#konfigurasi-midtrans-dashboard)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## 🏗️ Arsitektur

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│   React     │────────>│  Supabase Edge   │────────>│   Midtrans   │
│   Client    │<────────│    Functions     │<────────│     API      │
└─────────────┘         └──────────────────┘         └──────────────┘
      │                         │
      │                         │
      ▼                         ▼
┌─────────────┐         ┌──────────────────┐
│   Midtrans  │         │    Supabase      │
│  Snap Popup │         │    Database      │
└─────────────┘         └──────────────────┘
```

### Flow Pembayaran

1. **User creates booking** → Booking tersimpan di database dengan status `pending`
2. **User clicks "Bayar"** → Frontend memanggil Edge Function `create-snap-token`
3. **Edge Function** → Membuat Snap Token via Midtrans API
4. **Frontend** → Membuka Snap popup dengan token yang didapat
5. **User completes payment** → Midtrans mengirim notification ke webhook
6. **Webhook** → Update status booking di database menjadi `paid`
7. **Frontend** → Menampilkan success message dan meeting link

## 🚀 Setup Awal

### 1. Install Dependencies

Semua dependencies sudah ter-install. Pastikan Anda menjalankan:

```bash
npm install
```

### 2. Environment Variables

#### Frontend (.env)

```env
# Midtrans Configuration (Frontend)
VITE_MIDTRANS_CLIENT_KEY=Mid-client-l0wocZIeQwG7_siv
VITE_MIDTRANS_IS_PRODUCTION=false
```

#### Backend (Supabase Dashboard)

Masuk ke **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Tambahkan environment variables berikut:

```
MIDTRANS_SERVER_KEY=Mid-server-stGo93CuRMaTVujA5404t0WA
MIDTRANS_IS_PRODUCTION=false
```

**PENTING:** Untuk production, ganti dengan Server Key dan Client Key production dari Midtrans Dashboard.

## 🗄️ Konfigurasi Database

### 1. Jalankan Migration

```bash
# Jika menggunakan Supabase CLI
supabase migration up

# Atau copy-paste SQL dari file migration ke Supabase SQL Editor
```

File migration: `supabase/migrations/20250120_add_midtrans_payment.sql`

Migration ini akan:
- Menambahkan kolom `order_id` dan `paid_at` ke tabel `bookings`
- Membuat tabel `payment_logs` untuk tracking webhook notifications
- Membuat index untuk performa query
- Setup Row Level Security (RLS) policies

### 2. Verifikasi Database

Jalankan query berikut untuk verifikasi:

```sql
-- Check bookings table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
AND column_name IN ('order_id', 'paid_at');

-- Check payment_logs table
SELECT * FROM payment_logs LIMIT 1;
```

## 🚀 Deploy Edge Functions

### 1. Deploy create-snap-token

```bash
supabase functions deploy create-snap-token
```

### 2. Deploy midtrans-webhook

```bash
supabase functions deploy midtrans-webhook
```

### 3. Verifikasi Deployment

```bash
supabase functions list
```

Output seharusnya menampilkan:
- `create-snap-token`
- `midtrans-webhook`

### 4. Test Edge Function Locally (Optional)

```bash
# Start Supabase local development
supabase start

# Serve functions locally
supabase functions serve create-snap-token --env-file .env.local

# Test dengan curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-snap-token' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"bookingId":"YOUR_BOOKING_ID"}'
```

## 🎛️ Konfigurasi Midtrans Dashboard

### 1. Login ke Midtrans Dashboard

- **Sandbox:** https://dashboard.sandbox.midtrans.com
- **Production:** https://dashboard.midtrans.com

### 2. Setup Webhook URL

Masuk ke **Settings** → **Configuration** → **Payment Notification URL**

Set URL webhook:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook
```

Ganti `YOUR_PROJECT_ID` dengan project ID Supabase Anda.

### 3. Enabled Payment Methods

Pastikan payment methods yang Anda inginkan sudah enabled:
- ✅ Credit Card (Visa, Mastercard)
- ✅ Bank Transfer (BCA, Mandiri, BNI, BRI)
- ✅ E-Wallet (GoPay, OVO, DANA, ShopeePay)

### 4. Get API Keys

Copy API Keys dari **Settings** → **Access Keys**:
- **Client Key** → untuk frontend (VITE_MIDTRANS_CLIENT_KEY)
- **Server Key** → untuk backend Edge Functions (MIDTRANS_SERVER_KEY)

## 🧪 Testing

### 1. Test Payment Flow (Sandbox)

Gunakan test cards berikut di Sandbox:

#### Sukses
```
Card Number: 4811 1111 1111 1114
CVV: 123
Expiry: 01/25 (any future date)
OTP: 112233
```

#### Gagal
```
Card Number: 4011 1111 1111 1112
CVV: 123
Expiry: 01/25
```

### 2. Test Bank Transfer

Sandbox akan generate Virtual Account number. Untuk testing, cukup klik tombol "Simulate Payment" di Midtrans Sandbox Dashboard.

### 3. Monitoring Webhook

Check logs di Supabase:

```bash
supabase functions logs midtrans-webhook
```

Atau check tabel `payment_logs`:

```sql
SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 10;
```

## 🌐 Production Deployment

### 1. Update Environment Variables

#### Frontend
```env
VITE_MIDTRANS_CLIENT_KEY=your_production_client_key
VITE_MIDTRANS_IS_PRODUCTION=true
```

#### Supabase Edge Functions
```
MIDTRANS_SERVER_KEY=your_production_server_key
MIDTRANS_IS_PRODUCTION=true
```

### 2. Deploy ke Production

```bash
# Build frontend
npm run build

# Deploy Edge Functions dengan production config
supabase functions deploy create-snap-token
supabase functions deploy midtrans-webhook
```

### 3. Update Webhook di Midtrans Production

Masuk ke Production Dashboard dan update Webhook URL ke production Edge Function URL.

### 4. Security Checklist

- ✅ Semua API keys menggunakan production keys
- ✅ HTTPS enabled di semua endpoints
- ✅ RLS policies enabled di Supabase
- ✅ Webhook signature verification enabled
- ✅ Environment variables tidak di-commit ke Git

## 🔧 Troubleshooting

### Payment popup tidak muncul

**Penyebab:** Snap script gagal load

**Solusi:**
1. Check console browser untuk errors
2. Pastikan `VITE_MIDTRANS_CLIENT_KEY` sudah di-set dengan benar
3. Clear browser cache dan reload

### Webhook tidak terima notification

**Penyebab:** URL webhook salah atau tidak accessible

**Solusi:**
1. Verifikasi URL webhook di Midtrans Dashboard
2. Test endpoint webhook dengan curl:
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook
   ```
3. Check Supabase Edge Function logs

### Payment status tidak update

**Penyebab:** Signature verification gagal atau database error

**Solusi:**
1. Check Edge Function logs:
   ```bash
   supabase functions logs midtrans-webhook
   ```
2. Verifikasi `MIDTRANS_SERVER_KEY` match dengan yang di Midtrans
3. Check tabel `payment_logs` untuk error details

### CORS Error

**Penyebab:** CORS headers tidak di-set dengan benar

**Solusi:**
CORS headers sudah di-handle di Edge Functions. Jika masih error:
1. Check browser console untuk detail error
2. Pastikan request include proper Authorization header
3. Verifikasi Supabase project settings

## 📚 Referensi

- [Midtrans Snap Documentation](https://docs.midtrans.com/docs/snap-snap-integration-guide)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Midtrans API Reference](https://api-docs.midtrans.com/)

## 📝 Notes

### Test Cards untuk Sandbox

| Scenario | Card Number | Result |
|----------|-------------|--------|
| Success | 4811 1111 1111 1114 | Transaction success |
| Failure | 4011 1111 1111 1112 | Transaction failed |
| Challenge | 4911 1111 1111 1113 | 3DS authentication |

### Payment Status Mapping

| Midtrans Status | Booking Status | Payment Status |
|----------------|----------------|----------------|
| capture/settlement | confirmed | paid |
| pending | pending | pending |
| deny/cancel/expire | cancelled | failed |
| refund | cancelled | refunded |

## 🆘 Support

Jika mengalami masalah:
1. Check logs di Supabase Dashboard
2. Check dokumentasi Midtrans
3. Buat issue di repository ini

---

**Selamat menggunakan Midtrans Snap! 🎉**
