# Debugging Guide - Midtrans Integration

Guide untuk troubleshooting dan debugging Midtrans Snap integration.

## 🔍 Enhanced Logging

Edge Function `create-snap-token` sekarang memiliki comprehensive logging untuk debugging.

### Logs yang Tersedia

```typescript
// 1. Booking data from database
console.log('Booking data:', booking)

// 2. User profile data
console.log('User profile:', userProfile)

// 3. Midtrans configuration (safe - no full server key)
console.log('Midtrans config:', {
  isProduction: false,
  serverKeyPrefix: 'Mid-server...',
  snapUrl: 'https://app.sandbox.midtrans.com/...'
})

// 4. Request payload to Midtrans
console.log('Midtrans request payload:', transactionDetails)

// 5. Response from Midtrans
console.log('Midtrans response status:', 200)
console.log('Midtrans response body:', responseText)

// 6. Errors (if any)
console.error('Midtrans API error:', {
  status: 400,
  body: errorDetails
})
```

## 📊 How to View Logs

### Real-time Monitoring

```bash
# Watch create-snap-token logs
supabase functions logs create-snap-token --follow

# Watch webhook logs
supabase functions logs midtrans-webhook --follow
```

### Recent Logs

```bash
# View last 100 lines
supabase functions logs create-snap-token

# View last 50 lines
supabase functions logs create-snap-token --tail 50
```

## 🐛 Common Errors & Solutions

### 1. Error 400: Bad Request

**Symptoms:**
```
Midtrans API error: 400 - {"error_messages": [...]}
```

**Check Logs For:**
```bash
supabase functions logs create-snap-token
```

Look for:
- `Midtrans request payload` - Verify payload structure
- `Midtrans response body` - Read exact error from Midtrans

**Common Causes:**

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `gross_amount must be a number` | Wrong data type | Check `booking.total_price` is number |
| `transaction_details.order_id already exist` | Duplicate order | Order ID must be unique |
| `Invalid merchant credentials` | Wrong server key | Check `MIDTRANS_SERVER_KEY` |
| `customer_details.email is not valid` | Invalid email | Verify email format |

### 2. Error: Booking not found

**Check Logs:**
```
Booking fetch error: {...}
```

**Solutions:**
- Verify `bookingId` is valid UUID
- Check booking exists in database
- Verify foreign keys (expert_id, session_type_id)

### 3. Error: User not authenticated

**Check Logs:**
```
User not authenticated
```

**Solutions:**
- Verify Authorization header sent from frontend
- Check token is valid
- User session may have expired

### 4. Missing Data in Payload

**Check Logs:**
```json
{
  "customer_details": {
    "first_name": "Customer",  // ❌ Fallback value used
    "email": ""                // ❌ Empty email
  }
}
```

**Solutions:**
- Check `users` table has data for user
- Verify `userProfile` query returns data
- Add default values for optional fields

## 🔧 Debugging Workflow

### Step 1: Create Test Booking

```typescript
// In browser console or test
const booking = await createBooking({
  expert_id: 'expert-uuid',
  session_type_id: 'session-uuid',
  booking_date: '2025-01-25',
  booking_time: '14:00',
  topic: 'Test booking',
  total_price: 100000
});

console.log('Booking created:', booking.id);
```

### Step 2: Watch Logs

```bash
# Terminal 1: Start log monitoring
supabase functions logs create-snap-token --follow

# Terminal 2: Test payment
# Click "Bayar Sekarang" in UI
```

### Step 3: Analyze Logs

Look for this sequence:

```
✅ Booking data: { ... }           // Booking found
✅ User profile: { ... }           // User data retrieved
✅ Midtrans config: { ... }        // Config loaded
✅ Midtrans request payload: { ... }  // Payload prepared
✅ Midtrans response status: 201   // Success!
✅ Midtrans response body: { "token": "..." }
```

If error occurs:
```
❌ Midtrans response status: 400
❌ Midtrans response body: { "error_messages": [...] }
```

### Step 4: Fix Issues

Based on error message, apply fixes and redeploy:

```bash
# After fixing code
supabase functions deploy create-snap-token

# Test again
```

## 📝 Log Analysis Examples

### Example 1: Successful Request

```json
// Request payload
{
  "transaction_details": {
    "order_id": "BOOK-abc123-1705843200000",
    "gross_amount": 150000
  },
  "customer_details": {
    "first_name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890"
  },
  "item_details": [{
    "id": "session-123",
    "price": 150000,
    "quantity": 1,
    "name": "1-on-1 Consultation - Jane Expert"
  }]
}

// Response (success)
Status: 201
Body: {
  "token": "66e4fa55-fdac-4ef9-91b5-733b97d1b862",
  "redirect_url": "https://app.sandbox.midtrans.com/snap/v3/..."
}
```

### Example 2: Error - Invalid Amount

```json
// Request payload
{
  "transaction_details": {
    "order_id": "BOOK-xyz-1705843200000",
    "gross_amount": "150000"  // ❌ String instead of number
  },
  ...
}

// Response (error)
Status: 400
Body: {
  "error_messages": [
    "transaction_details.gross_amount must be a number"
  ]
}
```

**Fix:**
```typescript
// Ensure total_price is stored as number in database
total_price: parseInt(price) // or parseFloat(price)
```

### Example 3: Error - Missing Required Field

```json
// Request payload
{
  "transaction_details": {
    "order_id": "BOOK-abc-1705843200000"
    // ❌ Missing gross_amount
  },
  ...
}

// Response (error)
Status: 400
Body: {
  "error_messages": [
    "transaction_details.gross_amount is required"
  ]
}
```

**Fix:**
```typescript
// Check booking has total_price
if (!booking.total_price) {
  throw new Error('Booking total_price is required');
}
```

## 🧪 Testing Checklist

Before reporting issues, verify:

- [ ] Edge Function deployed: `supabase functions list`
- [ ] Environment variables set: `supabase secrets list`
- [ ] Server key is correct (Sandbox/Production)
- [ ] Booking exists in database
- [ ] User is authenticated
- [ ] Total price is number, not string
- [ ] Order ID is unique
- [ ] Email format is valid

## 🔍 Advanced Debugging

### Check Database Values

```sql
-- Check booking data
SELECT
  b.id,
  b.total_price,
  b.expert_id,
  b.session_type_id,
  b.payment_status,
  e.name as expert_name,
  s.name as session_name,
  s.price as session_price
FROM bookings b
LEFT JOIN experts e ON e.id = b.expert_id
LEFT JOIN session_types s ON s.id = b.session_type_id
WHERE b.id = 'your-booking-id';

-- Check user data
SELECT id, name, email, phone
FROM users
WHERE id = 'your-user-id';
```

### Test Midtrans API Directly

```bash
# Test with curl
curl -X POST https://app.sandbox.midtrans.com/snap/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'YOUR_SERVER_KEY:' | base64)" \
  -d '{
    "transaction_details": {
      "order_id": "TEST-001",
      "gross_amount": 100000
    },
    "customer_details": {
      "first_name": "Test",
      "email": "test@example.com"
    },
    "item_details": [{
      "id": "ITEM-001",
      "price": 100000,
      "quantity": 1,
      "name": "Test Item"
    }]
  }'
```

## 📚 Useful Commands

```bash
# View all Edge Functions
supabase functions list

# Check secrets (won't show values)
supabase secrets list

# Deploy with logs
supabase functions deploy create-snap-token && \
supabase functions logs create-snap-token --follow

# Delete old logs (if too much noise)
# Logs auto-delete after retention period

# Test locally (if setup)
supabase functions serve create-snap-token
```

## 🆘 Getting Help

If issues persist:

1. **Collect logs:**
   ```bash
   supabase functions logs create-snap-token > logs.txt
   ```

2. **Check Midtrans Dashboard:**
   - Login to https://dashboard.sandbox.midtrans.com
   - Check "Transactions" for failed attempts
   - View error details

3. **Review documentation:**
   - [MIDTRANS_INTEGRATION.md](MIDTRANS_INTEGRATION.md)
   - [Midtrans Snap Docs](https://docs.midtrans.com/docs/snap-snap-integration-guide)

4. **Common issues:**
   - [FIXES_COLUMN_NAMES.md](FIXES_COLUMN_NAMES.md)
   - [FIXES_CORS.md](FIXES_CORS.md)
   - [FIXES_AUTHORIZATION.md](FIXES_AUTHORIZATION.md)

---

**Created:** 2025-01-20
**Last Updated:** 2025-01-20
**Status:** Active Development
