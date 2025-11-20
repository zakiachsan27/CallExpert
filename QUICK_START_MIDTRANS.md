# Quick Start - Midtrans Integration

Panduan cepat untuk menjalankan Midtrans Snap di local development.

## ⚡ Setup dalam 5 Menit

### 1. Environment Variables

Buat file `.env` di root project (sudah dibuat):

```env
VITE_MIDTRANS_CLIENT_KEY=Mid-client-l0wocZIeQwG7_siv
VITE_MIDTRANS_IS_PRODUCTION=false
```

### 2. Set Supabase Secrets

```bash
# Via Supabase CLI
supabase secrets set MIDTRANS_SERVER_KEY=Mid-server-stGo93CuRMaTVujA5404t0WA
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

Atau via **Supabase Dashboard**:
1. Buka Project Settings → Edge Functions
2. Tambahkan secrets:
   - `MIDTRANS_SERVER_KEY`: `Mid-server-stGo93CuRMaTVujA5404t0WA`
   - `MIDTRANS_IS_PRODUCTION`: `false`

### 3. Run Database Migration

**Via Supabase Dashboard:**
1. Buka SQL Editor
2. Copy paste isi file `supabase/migrations/20250120_add_midtrans_payment.sql`
3. Run query

**Via Supabase CLI:**
```bash
supabase db push
```

### 4. Deploy Edge Functions

```bash
# Deploy create-snap-token
supabase functions deploy create-snap-token

# Deploy webhook handler (Updated dengan Web Crypto API)
supabase functions deploy midtrans-webhook
```

**Note:** Webhook function telah diupdate untuk menggunakan Web Crypto API (built-in) untuk SHA-512 hashing, menggantikan deprecated hash module.

### 5. Configure Midtrans Webhook

1. Login ke https://dashboard.sandbox.midtrans.com
2. Masuk ke Settings → Configuration
3. Set Payment Notification URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook
   ```
4. Save

### 6. Run Development Server

```bash
npm run dev
```

## 🧪 Testing Sandbox

### Test Credit Card
```
Card: 4811 1111 1111 1114
CVV: 123
Exp: 01/25
OTP: 112233
```

### Test Flow
1. Buat booking baru
2. Klik "Bayar Sekarang"
3. Popup Midtrans akan muncul
4. Pilih Credit Card
5. Masukkan test card
6. Complete payment
7. Status booking otomatis update menjadi "Paid"

## 📁 File Structure

```
CallExpert/
├── src/
│   ├── components/
│   │   ├── MidtransPayment.tsx      # Payment component
│   │   └── BookingSuccess.tsx        # Updated dengan Midtrans
│   ├── hooks/
│   │   └── useMidtransSnap.ts       # Snap hook
│   └── services/
│       └── midtrans.ts               # Midtrans API service
├── supabase/
│   ├── functions/
│   │   ├── create-snap-token/       # Generate token
│   │   └── midtrans-webhook/        # Payment notification
│   └── migrations/
│       └── 20250120_add_midtrans_payment.sql
├── .env                              # Environment variables
└── MIDTRANS_INTEGRATION.md          # Full documentation
```

## 🔍 Verify Integration

### Check Edge Functions

```bash
supabase functions list
```

Should show:
- ✅ create-snap-token
- ✅ midtrans-webhook

### Check Database

```sql
-- Check payment_logs table exists
SELECT * FROM payment_logs LIMIT 1;

-- Check bookings has new columns
SELECT order_id, paid_at FROM bookings LIMIT 1;
```

### Check Logs

```bash
# Watch webhook logs
supabase functions logs midtrans-webhook --follow

# Watch create token logs
supabase functions logs create-snap-token --follow
```

## 🚨 Common Issues

### 1. Snap popup tidak muncul
- Check browser console
- Verify `VITE_MIDTRANS_CLIENT_KEY` di .env
- Clear cache dan reload

### 2. "Failed to create snap token"
- Check Edge Function logs: `supabase functions logs create-snap-token`
- Verify Supabase secrets sudah di-set
- Check booking ID valid

### 3. Payment berhasil tapi status tidak update
- Check webhook logs: `supabase functions logs midtrans-webhook`
- Verify webhook URL di Midtrans Dashboard
- Check `payment_logs` table untuk error

## 📊 Monitor Payments

### Real-time monitoring

```sql
-- Latest payment logs
SELECT
  pl.*,
  b.status,
  b.payment_status
FROM payment_logs pl
JOIN bookings b ON b.id = pl.booking_id
ORDER BY pl.created_at DESC
LIMIT 10;

-- Pending payments
SELECT * FROM bookings
WHERE payment_status = 'pending'
ORDER BY created_at DESC;

-- Successful payments today
SELECT * FROM bookings
WHERE payment_status = 'paid'
AND paid_at >= CURRENT_DATE
ORDER BY paid_at DESC;
```

## 🎯 Next Steps

1. ✅ Test semua payment methods (Card, Bank Transfer, E-Wallet)
2. ✅ Verify webhook notification working
3. ✅ Check payment logs di database
4. 🔄 Implement email notification
5. 🔄 Add payment receipt download
6. 🔄 Setup monitoring & alerts

## 📖 Full Documentation

Untuk dokumentasi lengkap, lihat [MIDTRANS_INTEGRATION.md](./MIDTRANS_INTEGRATION.md)

## 🆘 Need Help?

- 📚 [Midtrans Docs](https://docs.midtrans.com/)
- 📚 [Supabase Docs](https://supabase.com/docs)
- 🐛 Create issue di repository

---

Happy coding! 🚀
