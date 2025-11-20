# Fix: Midtrans API Validation Errors

## 🐛 Problem

Midtrans API returning 400 Bad Request with validation errors:

```json
{
  "error_messages": [
    "item_details Name too long",
    "transaction_details.order_id too long",
    "transaction_details.gross_amount is not equal to the sum of item_details"
  ]
}
```

## 🔍 Root Causes

1. **Order ID too long** - Exceeded 50 character limit
2. **Item name too long** - Exceeded 50 character limit
3. **Amount mismatch** - `gross_amount` didn't match sum of `item_details`

## ✅ Solutions Applied

### 1. Order ID Length Fix

**Before:**
```typescript
const orderId = `BOOK-${bookingId}-${Date.now()}`
// Example: "BOOK-550e8400-e29b-41d4-a716-446655440000-1705843200000"
// Length: 58 characters ❌ Too long!
```

**After:**
```typescript
const timestamp = Date.now()
const orderId = `ORDER-${timestamp}`.substring(0, 50)
// Example: "ORDER-1705843200000"
// Length: 19 characters ✅ Within limit
```

**Why:** Midtrans order_id has max 50 character limit.

### 2. Item Name Length Fix

**Before:**
```typescript
name: `${booking.session_types.name} - ${booking.experts.name}`
// Example: "1-on-1 Career Consultation and Mentoring Session - Dr. Jane Smith, MBA, Ph.D"
// Length: 75 characters ❌ Too long!
```

**After:**
```typescript
const sessionName = booking.session_types.name || 'Konsultasi'
const expertName = booking.experts.name || 'Expert'
const fullItemName = `${sessionName} - ${expertName}`
const itemName = fullItemName.length > 50
  ? fullItemName.substring(0, 47) + '...'
  : fullItemName
// Example: "1-on-1 Career Consultation - Dr. Jane Smi..."
// Length: 50 characters ✅ Within limit
```

**Why:** Midtrans item name has max 50 character limit.

### 3. Amount Calculation Fix

**Before:**
```typescript
transaction_details: {
  order_id: orderId,
  gross_amount: booking.total_price, // Could be different from item price
},
item_details: [{
  price: booking.session_types.price,
  quantity: 1,
  // Total: price × quantity (might not match gross_amount)
}]
```

**After:**
```typescript
// Calculate amounts - ensure they match
const itemPrice = booking.session_types.price
const itemQuantity = 1
const grossAmount = itemPrice * itemQuantity

transaction_details: {
  order_id: orderId,
  gross_amount: grossAmount, // ✅ Guaranteed to match
},
item_details: [{
  price: itemPrice,
  quantity: itemQuantity,
  // Total: 150000 × 1 = 150000 ✅ Matches gross_amount
}]
```

**Why:** Midtrans requires `gross_amount` = sum of (price × quantity) from all `item_details`.

## 📝 Complete Fix

**File: `supabase/functions/create-snap-token/index.ts`**

```typescript
// Generate unique order ID (max 50 chars)
const timestamp = Date.now()
const orderId = `ORDER-${timestamp}`.substring(0, 50)

// Calculate amounts - ensure they match
const itemPrice = booking.session_types.price
const itemQuantity = 1
const grossAmount = itemPrice * itemQuantity

// Truncate item name (max 50 chars)
const sessionName = booking.session_types.name || 'Konsultasi'
const expertName = booking.experts.name || 'Expert'
const fullItemName = `${sessionName} - ${expertName}`
const itemName = fullItemName.length > 50
  ? fullItemName.substring(0, 47) + '...'
  : fullItemName

// Validation logging
console.log('Payment details:', {
  orderId,
  grossAmount,
  itemPrice,
  itemQuantity,
  itemName,
  match: grossAmount === (itemPrice * itemQuantity)
})

const transactionDetails = {
  transaction_details: {
    order_id: orderId,
    gross_amount: grossAmount,
  },
  item_details: [{
    id: booking.session_types.id.substring(0, 50),
    price: itemPrice,
    quantity: itemQuantity,
    name: itemName,
  }],
  // ... rest of payload
}
```

## 📊 Midtrans Field Limits

| Field | Max Length | Example |
|-------|-----------|---------|
| `transaction_details.order_id` | 50 chars | `ORDER-1705843200000` |
| `item_details[].name` | 50 chars | `Career Consultation - Dr. Jane Smith` |
| `item_details[].id` | 50 chars | `session-123` |
| `customer_details.first_name` | 20 chars | `John Doe` |
| `customer_details.email` | 45 chars | `john.doe@example.com` |
| `customer_details.phone` | 19 chars | `+628123456789` |

## 🧪 Testing

### Valid Payload Example

```json
{
  "transaction_details": {
    "order_id": "ORDER-1705843200000",
    "gross_amount": 150000
  },
  "item_details": [{
    "id": "session-abc123",
    "price": 150000,
    "quantity": 1,
    "name": "1-on-1 Consultation - John Expert"
  }],
  "customer_details": {
    "first_name": "Jane",
    "email": "jane@example.com",
    "phone": "081234567890"
  }
}
```

### Validation Checklist

- [x] order_id ≤ 50 chars
- [x] item name ≤ 50 chars
- [x] gross_amount = sum of (item price × quantity)
- [x] All IDs truncated to 50 chars
- [x] Price is integer (not float with more than 2 decimals)

## 🔍 Verification Logs

After deploying, check logs for validation:

```bash
supabase functions logs create-snap-token
```

Look for:
```
Payment details: {
  orderId: 'ORDER-1705843200000',
  grossAmount: 150000,
  itemPrice: 150000,
  itemQuantity: 1,
  itemName: '1-on-1 Consultation - Expert Name',
  match: true  // ✅ This should be true!
}
```

## 🚨 Common Validation Errors

### Error: "order_id already exist"

**Cause:** Order ID not unique

**Solution:**
```typescript
// Use timestamp for uniqueness
const orderId = `ORDER-${Date.now()}`
```

### Error: "gross_amount must be an integer"

**Cause:** Float with too many decimals

**Solution:**
```typescript
// Ensure integer or max 2 decimals
const grossAmount = Math.round(price * 100) / 100
```

### Error: "item_details price must be positive"

**Cause:** Price is 0 or negative

**Solution:**
```typescript
// Validate price before sending
if (itemPrice <= 0) {
  throw new Error('Session price must be greater than 0')
}
```

### Error: "customer_details.email is not valid"

**Cause:** Invalid email format

**Solution:**
```typescript
// Validate email format
const email = userProfile?.email || user.email || ''
if (!email.includes('@')) {
  throw new Error('Valid email is required')
}
```

## 📚 Best Practices

### 1. Always Truncate Long Strings

```typescript
const truncate = (str: string, maxLen: number) => {
  if (str.length <= maxLen) return str
  return str.substring(0, maxLen - 3) + '...'
}

const itemName = truncate(fullName, 50)
const orderId = truncate(generatedId, 50)
```

### 2. Ensure Amount Match

```typescript
// Calculate total from items
const itemsTotal = item_details.reduce((sum, item) =>
  sum + (item.price * item.quantity), 0
)

// Use this as gross_amount
const grossAmount = itemsTotal
```

### 3. Validate Before Sending

```typescript
// Pre-flight validation
if (orderId.length > 50) throw new Error('Order ID too long')
if (itemName.length > 50) throw new Error('Item name too long')
if (grossAmount !== itemPrice * itemQuantity) {
  throw new Error('Amount mismatch')
}
```

## 🔄 Migration Notes

If you have existing bookings with long order IDs, you may need to handle them:

```typescript
// Check if booking already has order_id
if (booking.order_id && booking.order_id.length <= 50) {
  orderId = booking.order_id // Reuse existing
} else {
  orderId = `ORDER-${Date.now()}`.substring(0, 50) // Generate new
}
```

## 📖 References

- [Midtrans Snap API Docs](https://api-docs.midtrans.com/#snap-api)
- [Midtrans Parameter Limits](https://docs.midtrans.com/docs/snap-integration-guide#transaction-details)

## ✅ Verification

After deploying fix, test with:

```bash
# Deploy
supabase functions deploy create-snap-token

# Test payment flow
# Create booking → Click "Bayar" → Should get Snap token

# Check logs
supabase functions logs create-snap-token
```

Expected result:
```
✅ Payment details: { match: true }
✅ Midtrans response status: 201
✅ Midtrans response body: { "token": "..." }
```

---

**Fixed:** 2025-01-20
**Issue:** Midtrans validation errors (field length & amount mismatch)
**Status:** ✅ Resolved
