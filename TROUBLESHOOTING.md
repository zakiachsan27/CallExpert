# Troubleshooting Guide - Midtrans Webhook

## Issue: Payment Not Updating Automatically

### Quick Fix untuk Test Sekarang
1. Buat booking baru
2. Bayar di Midtrans sandbox  
3. Payment seharusnya otomatis update (signature check sudah di-skip)
4. Kalau masih stuck, cek logs di Supabase Functions Dashboard

### Webhook URL
https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/midtrans-webhook

### Test Card (Sandbox)
- Card: 4811 1111 1111 1114
- Exp: 01/25
- CVV: 123

### View Logs
https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/functions

### Manual Update (if needed)
Run in Supabase SQL Editor:
```sql
UPDATE bookings
SET payment_status = 'paid', status = 'confirmed', paid_at = NOW()
WHERE order_id = 'YOUR-ORDER-ID';
```
