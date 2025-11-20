# Fix: Column Names di Edge Functions

## 🐛 Problem

Error saat memanggil Edge Function `create-snap-token`:
```
code: "42703"
message: "column experts_1.full_name does not exist"
```

## 🔍 Root Cause

Query menggunakan nama kolom `full_name` untuk tabel `experts` dan `users`, padahal nama kolom yang benar adalah `name`.

## ✅ Solution

Update semua reference ke kolom `full_name` menjadi `name` di Edge Function.

## 📝 File yang Diperbaiki

### create-snap-token/index.ts

#### Fix 1: Query experts table

**Before:**
```typescript
.select(`
  *,
  experts (
    id,
    full_name,  // ❌ Wrong column name
    email
  ),
  ...
`)
```

**After:**
```typescript
.select(`
  *,
  experts (
    id,
    name,  // ✅ Correct column name
    email
  ),
  ...
`)
```

#### Fix 2: Query users table

**Before:**
```typescript
const { data: userProfile } = await supabaseClient
  .from('users')
  .select('full_name, email, phone')  // ❌ Wrong column name
  .eq('id', user.id)
  .single()
```

**After:**
```typescript
const { data: userProfile } = await supabaseClient
  .from('users')
  .select('name, email, phone')  // ✅ Correct column name
  .eq('id', user.id)
  .single()
```

#### Fix 3: Access expert name in item_details

**Before:**
```typescript
name: `${booking.session_types.name} - ${booking.experts.full_name}`
//                                                       ^^^^^^^^^ Wrong
```

**After:**
```typescript
name: `${booking.session_types.name} - ${booking.experts.name}`
//                                                       ^^^^ Correct
```

#### Fix 4: Access user name in customer_details

**Before:**
```typescript
customer_details: customerDetails || {
  first_name: userProfile?.full_name || user.email?.split('@')[0] || 'Customer',
  //                       ^^^^^^^^^ Wrong
  ...
}
```

**After:**
```typescript
customer_details: customerDetails || {
  first_name: userProfile?.name || user.email?.split('@')[0] || 'Customer',
  //                       ^^^^ Correct
  ...
}
```

## 📊 Database Schema

### Correct Column Names

| Table | Column | Type |
|-------|--------|------|
| `experts` | `name` | text |
| `users` | `name` | text |

**NOT:**
- ❌ `full_name`
- ❌ `expert_name`
- ❌ `user_name`

## 🧪 How to Verify Column Names

### Method 1: SQL Query

```sql
-- Check experts table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'experts'
ORDER BY ordinal_position;

-- Check users table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### Method 2: Supabase Dashboard

1. Go to Table Editor
2. Select `experts` table
3. Check column names
4. Repeat for `users` table

### Method 3: Check Other Edge Functions

Look at `make-server-92eeba71/index.ts` which uses the correct column names:

```typescript
// Line 264 - correct usage
name: dbData.name,  // ✅ Using 'name', not 'full_name'
```

## 🔍 Finding Similar Issues

Search for potential column name mismatches:

```bash
# Search for full_name usage
grep -r "full_name" supabase/functions/

# Search for name column usage
grep -r "\.name" supabase/functions/
```

## 📋 Checklist for Edge Functions

When writing Edge Functions that query database:

- [ ] Check actual column names in database
- [ ] Use Supabase Table Editor to verify schema
- [ ] Reference existing working Edge Functions
- [ ] Test queries in SQL Editor first
- [ ] Check for typos in column names
- [ ] Use TypeScript types if available

## 🚀 Deployment

Deploy the fixed Edge Function:

```bash
supabase functions deploy create-snap-token
```

## 🧪 Testing

### Test the Fixed Function

```typescript
// Create a booking first
const booking = await createBooking({...});

// Call create-snap-token
const response = await supabase.functions.invoke('create-snap-token', {
  body: { bookingId: booking.id }
});

// Should return snap token without column error
console.log(response.data);
```

### Expected Response

```json
{
  "token": "xxxxx-xxxxx-xxxxx",
  "redirect_url": "https://...",
  "order_id": "BOOK-xxx-123456789"
}
```

### NOT This Error

```json
{
  "error": "column experts_1.full_name does not exist"
}
```

## 📚 Related Fixes

This is part of a series of fixes:

1. [CHANGELOG_MIDTRANS.md](CHANGELOG_MIDTRANS.md) - Webhook hash fix
2. [FIXES_AUTHORIZATION.md](FIXES_AUTHORIZATION.md) - Auth header fix
3. [FIXES_CORS.md](FIXES_CORS.md) - CORS fix
4. **[FIXES_COLUMN_NAMES.md](FIXES_COLUMN_NAMES.md)** - This fix

## ⚠️ Common Column Name Issues

### Pattern to Watch For

| Wrong | Correct | Table |
|-------|---------|-------|
| `full_name` | `name` | experts, users |
| `expert_name` | `name` | experts |
| `user_name` | `name` | users |
| `avatar` | `avatar_url` | experts |
| `jobTitle` | `role` | experts |

### Why This Happens

1. **Inconsistent naming**: Different parts of codebase use different conventions
2. **Copy-paste errors**: Copying from examples with different schema
3. **Schema changes**: Database schema changed but code not updated
4. **Missing types**: No TypeScript types to catch these errors

## 🛡️ Prevention

### 1. Use TypeScript Types

```typescript
// Define types based on actual database schema
type Expert = {
  id: string;
  name: string;  // NOT full_name
  email: string;
  avatar_url: string;  // NOT avatar
  role: string;  // NOT jobTitle
  // ... other fields
};

// Use in queries
const { data } = await supabase
  .from('experts')
  .select<'*', Expert>('*');
```

### 2. Create Schema Documentation

Document actual column names:

```typescript
/**
 * Database Schema Reference
 *
 * experts table:
 * - id: UUID
 * - name: TEXT (NOT full_name)
 * - email: TEXT
 * - avatar_url: TEXT (NOT avatar)
 * - role: TEXT (NOT jobTitle)
 * - bio: TEXT
 * - company: TEXT
 * - experience: INTEGER
 * - location_city: TEXT
 * - location_country: TEXT
 * - availability: TEXT
 * - created_at: TIMESTAMP
 * - updated_at: TIMESTAMP
 */
```

### 3. Test Queries First

Before using in Edge Function, test in SQL Editor:

```sql
-- Test the exact query
SELECT
  b.*,
  e.name,  -- Test column name
  e.email
FROM bookings b
JOIN experts e ON e.id = b.expert_id
WHERE b.id = 'test-id';
```

## 📝 Summary

| Issue | Fix | Status |
|-------|-----|--------|
| `experts.full_name` | Changed to `experts.name` | ✅ Fixed |
| `users.full_name` | Changed to `users.name` | ✅ Fixed |
| Query in line 42 | Updated | ✅ Fixed |
| Query in line 64 | Updated | ✅ Fixed |
| Usage in line 87 | Updated | ✅ Fixed |
| Usage in line 96 | Updated | ✅ Fixed |

---

**Fixed:** 2025-01-20
**Issue:** PostgreSQL error 42703 - column does not exist
**Status:** ✅ Resolved
