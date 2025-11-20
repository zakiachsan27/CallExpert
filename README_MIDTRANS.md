# Midtrans Snap Payment Integration

Integrasi lengkap Midtrans Snap untuk CallExpert platform (React + Supabase).

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [QUICK_START_MIDTRANS.md](./QUICK_START_MIDTRANS.md) | Setup cepat dalam 5 menit |
| [MIDTRANS_INTEGRATION.md](./MIDTRANS_INTEGRATION.md) | Dokumentasi lengkap dengan troubleshooting |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Checklist untuk deployment |
| [CHANGELOG_MIDTRANS.md](./CHANGELOG_MIDTRANS.md) | Log perubahan dan update |

## 🚀 Quick Start

### 1. Set Environment Variables

**File `.env`:**
```env
VITE_MIDTRANS_CLIENT_KEY=Mid-client-l0wocZIeQwG7_siv
VITE_MIDTRANS_IS_PRODUCTION=false
```

**Supabase Secrets:**
```bash
supabase secrets set MIDTRANS_SERVER_KEY=Mid-server-stGo93CuRMaTVujA5404t0WA
supabase secrets set MIDTRANS_IS_PRODUCTION=false
```

### 2. Deploy

```bash
# Run migration
supabase db push

# Deploy Edge Functions
supabase functions deploy create-snap-token
supabase functions deploy midtrans-webhook

# Start dev server
npm run dev
```

### 3. Configure Webhook

Set webhook URL di [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com):
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook
```

## 🎯 Features

✅ **Multiple Payment Methods**
- Credit/Debit Card (Visa, Mastercard, JCB)
- Bank Transfer (BCA, Mandiri, BNI, BRI)
- E-Wallet (GoPay, OVO, DANA, ShopeePay)

✅ **Automatic Status Update**
- Real-time webhook notification
- Auto-update booking status
- Payment logging

✅ **Security**
- SHA-512 signature verification
- Row Level Security (RLS)
- Secure API key management

✅ **Developer Friendly**
- Full TypeScript support
- Comprehensive error handling
- Detailed logging

## 📁 File Structure

```
CallExpert/
├── src/
│   ├── components/
│   │   ├── MidtransPayment.tsx       # Main payment component
│   │   └── BookingSuccess.tsx         # Updated with Midtrans
│   ├── hooks/
│   │   └── useMidtransSnap.ts        # Snap popup hook
│   ├── services/
│   │   └── midtrans.ts                # API service
│   └── types/
│       └── midtrans.d.ts              # TypeScript definitions
├── supabase/
│   ├── functions/
│   │   ├── create-snap-token/         # Token generator
│   │   └── midtrans-webhook/          # Webhook handler
│   └── migrations/
│       └── 20250120_add_midtrans_payment.sql
├── .env                                # Environment variables
├── QUICK_START_MIDTRANS.md            # Quick start guide
├── MIDTRANS_INTEGRATION.md            # Full documentation
├── DEPLOYMENT_CHECKLIST.md            # Deployment checklist
└── CHANGELOG_MIDTRANS.md              # Changelog
```

## 🧪 Testing (Sandbox)

### Test Credit Card

```
Card Number: 4811 1111 1111 1114
CVV: 123
Expiry: 01/25
OTP: 112233
```

### Test Flow

1. Create booking → Status: `pending`
2. Click "Bayar Sekarang" → Snap popup opens
3. Complete payment → Webhook triggered
4. Status updated → `paid`

### Monitor Payments

```bash
# Watch webhook logs
supabase functions logs midtrans-webhook --follow

# Check payment logs
supabase db query "SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 10"
```

## 🔧 Architecture

```
┌─────────────┐
│   React     │ User creates booking
│   Client    │────────────────────────┐
└─────────────┘                        │
       │                               ▼
       │                        ┌──────────────┐
       │                        │   Supabase   │
       │                        │   Database   │
       │                        └──────────────┘
       │                               │ booking_id
       │ 1. Request                    │
       │    Snap Token                 │
       ▼                               │
┌─────────────┐                        │
│  Supabase   │                        │
│    Edge     │◄───────────────────────┘
│  Function   │ 2. Get booking details
│create-snap  │
│   -token    │ 3. Call Midtrans API
└─────────────┘────────────────────────┐
       │                               │
       │ 4. Return token               ▼
       │                        ┌──────────────┐
       ▼                        │   Midtrans   │
┌─────────────┐                │     API      │
│   React     │                └──────────────┘
│   Client    │                       │
└─────────────┘                       │
       │                              │
       │ 5. Open Snap popup           │
       │    with token                │
       ▼                              │
┌─────────────┐                       │
│  Midtrans   │                       │
│Snap Popup   │◄──────────────────────┘
└─────────────┘
       │
       │ 6. User completes payment
       │
       ▼
┌─────────────┐
│   Midtrans  │ 7. Send webhook
│   Server    │    notification
└─────────────┘
       │
       ▼
┌─────────────┐ 8. Verify signature
│  Supabase   │    & update DB
│    Edge     │
│  Function   │
│  midtrans-  │
│  webhook    │
└─────────────┘
       │
       ▼
┌──────────────┐ 9. Status updated
│   Supabase   │    to "paid"
│   Database   │
└──────────────┘
       │
       ▼
┌─────────────┐ 10. UI shows
│   React     │     success
│   Client    │
└─────────────┘
```

## 🔒 Security

### API Keys Management

- **Client Key**: Safe untuk frontend (public)
- **Server Key**: Hanya di backend Edge Functions (private)
- Keys disimpan di environment variables
- Tidak pernah di-commit ke Git

### Webhook Security

- SHA-512 signature verification
- Menggunakan Web Crypto API
- Reject unauthorized requests
- Log semua attempts

### Database Security

- Row Level Security (RLS) enabled
- Users hanya bisa lihat payment logs mereka sendiri
- Service role key untuk webhook (bypass RLS)

## 📊 Monitoring & Logging

### Edge Function Logs

```bash
# Real-time monitoring
supabase functions logs midtrans-webhook --follow

# View recent logs
supabase functions logs create-snap-token
```

### Database Queries

```sql
-- Recent payments
SELECT
  b.id,
  b.order_id,
  b.payment_status,
  b.paid_at,
  pl.transaction_status
FROM bookings b
LEFT JOIN payment_logs pl ON pl.booking_id = b.id
WHERE b.payment_status IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 20;

-- Payment statistics
SELECT
  payment_status,
  COUNT(*) as count,
  SUM(total_price) as total_amount
FROM bookings
WHERE payment_status IS NOT NULL
GROUP BY payment_status;

-- Failed payments
SELECT * FROM payment_logs
WHERE transaction_status IN ('deny', 'cancel', 'expire')
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### Snap Popup Tidak Muncul

**Penyebab:**
- Script Snap gagal load
- Client Key salah

**Solusi:**
1. Check browser console
2. Verify `VITE_MIDTRANS_CLIENT_KEY`
3. Clear cache & reload

### Webhook Tidak Terima Notification

**Penyebab:**
- URL webhook salah
- Endpoint tidak accessible

**Solusi:**
1. Verify webhook URL di Midtrans Dashboard
2. Test endpoint: `curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook`
3. Check Edge Function logs

### Payment Status Tidak Update

**Penyebab:**
- Signature verification gagal
- Database error

**Solusi:**
1. Check webhook logs: `supabase functions logs midtrans-webhook`
2. Verify `MIDTRANS_SERVER_KEY` match dengan Midtrans
3. Check `payment_logs` table untuk details

## 📈 Next Steps

### Recommended Enhancements

1. **Email Notifications**
   - Send confirmation email after payment
   - Payment receipt
   - Booking reminder

2. **Admin Dashboard**
   - Payment monitoring dashboard
   - Transaction reports
   - Refund management

3. **Analytics**
   - Payment success rate tracking
   - Revenue analytics
   - Payment method preferences

4. **Error Handling**
   - Retry mechanism for failed webhooks
   - Alert system for payment failures
   - Automatic refund for duplicates

## 🆘 Support

### Resources

- 📚 [Midtrans Documentation](https://docs.midtrans.com/)
- 📚 [Supabase Documentation](https://supabase.com/docs)
- 📧 Midtrans Support: support@midtrans.com

### Common Issues

Check [MIDTRANS_INTEGRATION.md](./MIDTRANS_INTEGRATION.md) bagian Troubleshooting untuk solusi lengkap.

## 📝 Version

**Current Version:** 1.0.1

**Last Updated:** 2025-01-20

### Recent Changes

- ✅ Fixed webhook hash function (Web Crypto API)
- ✅ Improved signature verification
- ✅ Enhanced error logging

Lihat [CHANGELOG_MIDTRANS.md](./CHANGELOG_MIDTRANS.md) untuk detail lengkap.

## 📄 License

This integration is part of CallExpert platform.

---

**Ready to accept payments! 🎉**

For detailed setup instructions, see [QUICK_START_MIDTRANS.md](./QUICK_START_MIDTRANS.md)
