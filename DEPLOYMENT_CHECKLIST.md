# Deployment Checklist - Midtrans Integration

Gunakan checklist ini untuk memastikan deployment berjalan lancar.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

#### Frontend (.env)
- [ ] `VITE_MIDTRANS_CLIENT_KEY` sudah di-set
- [ ] `VITE_MIDTRANS_IS_PRODUCTION` set ke `false` (sandbox) atau `true` (production)

#### Supabase Secrets
- [ ] `MIDTRANS_SERVER_KEY` sudah di-set via Dashboard atau CLI
- [ ] `MIDTRANS_IS_PRODUCTION` sudah di-set
- [ ] Verify secrets dengan: `supabase secrets list`

### 2. Database Migration

- [ ] Migration file ada di `supabase/migrations/20250120_add_midtrans_payment.sql`
- [ ] Run migration:
  ```bash
  supabase db push
  ```
  Atau copy-paste ke SQL Editor di Supabase Dashboard
- [ ] Verify tables:
  ```sql
  -- Check bookings columns
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'bookings'
  AND column_name IN ('order_id', 'paid_at');

  -- Check payment_logs table
  SELECT * FROM payment_logs LIMIT 1;
  ```

### 3. Edge Functions

- [ ] Deploy `create-snap-token`:
  ```bash
  supabase functions deploy create-snap-token
  ```
- [ ] Deploy `midtrans-webhook`:
  ```bash
  supabase functions deploy midtrans-webhook
  ```
- [ ] Verify deployment:
  ```bash
  supabase functions list
  ```
  Should show both functions

### 4. Midtrans Dashboard Configuration

- [ ] Login ke Midtrans Dashboard (sandbox/production)
- [ ] Go to Settings → Configuration
- [ ] Set Payment Notification URL:
  ```
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook
  ```
- [ ] Verify enabled payment methods:
  - [ ] Credit Card
  - [ ] Bank Transfer (BCA, Mandiri, BNI, BRI)
  - [ ] E-Wallet (GoPay, OVO, DANA, ShopeePay)
- [ ] Copy API Keys to your environment

## 🧪 Testing Checklist

### Sandbox Testing

- [ ] Start dev server: `npm run dev`
- [ ] Create a test booking
- [ ] Click "Bayar Sekarang" button
- [ ] Verify Snap popup appears
- [ ] Test Credit Card payment:
  ```
  Card: 4811 1111 1111 1114
  CVV: 123
  Exp: 01/25
  OTP: 112233
  ```
- [ ] Complete payment in Snap popup
- [ ] Verify booking status updates to "paid"
- [ ] Check database:
  ```sql
  SELECT * FROM bookings WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 5;
  SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 5;
  ```

### Webhook Testing

- [ ] Watch webhook logs:
  ```bash
  supabase functions logs midtrans-webhook --follow
  ```
- [ ] Complete a test payment
- [ ] Verify webhook received notification
- [ ] Verify no signature errors in logs
- [ ] Verify booking updated correctly
- [ ] Verify payment_logs entry created

### Integration Testing

- [ ] Test all payment methods:
  - [ ] Credit Card
  - [ ] Bank Transfer (simulate via Midtrans Dashboard)
  - [ ] E-Wallet (simulate via Midtrans Dashboard)
- [ ] Test payment failure scenarios
- [ ] Test payment pending scenarios
- [ ] Verify UI updates correctly for each status

## 🚀 Production Deployment

### Pre-Production

- [ ] All sandbox tests passed
- [ ] Code reviewed and tested
- [ ] Update environment variables to production:
  - [ ] `VITE_MIDTRANS_CLIENT_KEY` → production key
  - [ ] `VITE_MIDTRANS_IS_PRODUCTION=true`
  - [ ] `MIDTRANS_SERVER_KEY` → production key (in Supabase)
  - [ ] `MIDTRANS_IS_PRODUCTION=true` (in Supabase)

### Deploy

- [ ] Build frontend:
  ```bash
  npm run build
  ```
- [ ] Deploy Edge Functions to production:
  ```bash
  supabase functions deploy create-snap-token
  supabase functions deploy midtrans-webhook
  ```
- [ ] Update webhook URL in Midtrans Production Dashboard
- [ ] Deploy frontend to hosting (Vercel/Netlify/etc)

### Post-Deployment

- [ ] Test production payment with real card
- [ ] Monitor Edge Function logs:
  ```bash
  supabase functions logs create-snap-token
  supabase functions logs midtrans-webhook
  ```
- [ ] Monitor database for payment_logs
- [ ] Verify email notifications (if implemented)
- [ ] Set up monitoring/alerts

## 🔒 Security Checklist

- [ ] API keys not committed to Git (check .gitignore)
- [ ] Environment variables properly secured
- [ ] Webhook signature verification working
- [ ] RLS policies enabled on payment_logs table
- [ ] HTTPS enabled on all endpoints
- [ ] Server Key only used in backend (Edge Functions)
- [ ] Client Key only exposed to frontend

## 📊 Monitoring

### Setup Monitoring

- [ ] Enable Supabase logging
- [ ] Set up alerts for Edge Function errors
- [ ] Monitor payment_logs table for anomalies
- [ ] Track payment success rate
- [ ] Monitor webhook delivery

### Regular Checks

Daily:
- [ ] Check payment_logs for errors
- [ ] Verify webhook receiving notifications
- [ ] Check booking statuses

Weekly:
- [ ] Review Edge Function logs
- [ ] Check for failed payments
- [ ] Analyze payment success rate

## 🆘 Rollback Plan

If issues occur in production:

1. **Immediate Actions:**
   - [ ] Check Edge Function logs for errors
   - [ ] Verify webhook URL is correct
   - [ ] Check Midtrans Dashboard for issues

2. **Rollback Steps:**
   ```bash
   # Revert to previous Edge Function version
   supabase functions deploy create-snap-token --legacy-bundle

   # Switch back to sandbox
   supabase secrets set MIDTRANS_IS_PRODUCTION=false
   ```

3. **Investigation:**
   - [ ] Check payment_logs for error patterns
   - [ ] Review recent code changes
   - [ ] Contact Midtrans support if needed

## 📝 Notes

- Webhook URL must be publicly accessible (not localhost)
- Signature verification prevents unauthorized webhook calls
- Always test in sandbox before production deployment
- Keep API keys secure and rotate periodically
- Monitor logs regularly for security and errors

## ✅ Final Verification

Before going live:
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team trained on monitoring
- [ ] Support process established
- [ ] Rollback plan tested
- [ ] Stakeholders notified

---

**Last Updated:** 2025-01-20
**Version:** 1.0.1 (with Web Crypto API fix)
