# Changelog - Midtrans Integration

## [1.0.1] - 2025-01-20

### Fixed
- **Webhook Hash Function**: Mengganti deprecated `createHash` dari `deno.land/std@0.168.0/hash/mod.ts` dengan Web Crypto API
  - Menggunakan `crypto.subtle.digest('SHA-512')` untuk signature verification
  - Lebih modern dan sesuai dengan Web Standards
  - Menghilangkan dependency ke external hash module yang deprecated

### Technical Details

**Before:**
```typescript
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts'

const hash = createHash('sha512')
hash.update(hashString)
const calculatedSignature = hash.toString()
```

**After:**
```typescript
// Using Web Crypto API (built-in)
const encoder = new TextEncoder()
const data = encoder.encode(signatureString)
const hashBuffer = await crypto.subtle.digest('SHA-512', data)
const hashArray = Array.from(new Uint8Array(hashBuffer))
const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
```

### Benefits
- ✅ No external dependencies for hashing
- ✅ Uses native Web Crypto API
- ✅ Better performance
- ✅ More secure and modern approach
- ✅ Compatible with Deno Deploy

---

## [1.0.0] - 2025-01-20

### Added
- Initial Midtrans Snap integration
- Supabase Edge Functions:
  - `create-snap-token`: Generate payment token
  - `midtrans-webhook`: Handle payment notifications
- React Components:
  - `MidtransPayment`: Payment UI component
  - `useMidtransSnap`: Custom hook for Snap popup
- Database schema:
  - `payment_logs` table for tracking transactions
  - Added `order_id` and `paid_at` columns to `bookings`
- Full TypeScript support with type definitions
- Comprehensive documentation
- Sandbox mode for testing

### Features
- ✅ Multiple payment methods (Credit Card, Bank Transfer, E-Wallet)
- ✅ Auto status update via webhook
- ✅ Payment logging and tracking
- ✅ Signature verification for security
- ✅ Row Level Security (RLS) policies
- ✅ Error handling and logging
