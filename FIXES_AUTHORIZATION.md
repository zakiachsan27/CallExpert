# Fix: Authorization Header untuk Edge Functions

## 🐛 Problem

Request ke Supabase Edge Function `make-server-92eeba71` tidak menyertakan Authorization header, menyebabkan error 401 Unauthorized.

## ✅ Solution

Menambahkan `Authorization` header dan `apikey` header ke semua requests ke Edge Functions.

## 📝 File yang Diperbaiki

### 1. RegisterPage.tsx

**Location:** `src/pages/RegisterPage.tsx`

**Before:**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/user/signup`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name
    })
  }
);
```

**After:**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/user/signup`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'apikey': publicAnonKey,
    },
    body: JSON.stringify({
      email,
      password,
      name
    })
  }
);
```

## ✅ Files Already Correct

Berikut adalah file yang sudah menggunakan Authorization header dengan benar:

### 1. ExpertDashboard.tsx
- ✅ `fetchExpertProfile()` - GET request
- ✅ `handleSaveProfile()` - PUT request
- ✅ `updateAvailabilityStatus()` - PUT request

### 2. ExpertTransactions.tsx
- ✅ `fetchTransactions()` - GET request
- ✅ `handleWithdrawSubmit()` - POST request

### 3. MidtransPayment.tsx (Baru)
- ✅ Menggunakan `supabase.functions.invoke()` yang otomatis include Authorization

## 📋 Best Practices

### Standard Header untuk Edge Functions

Semua request ke Supabase Edge Functions harus include headers berikut:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
  'apikey': publicAnonKey,
};
```

### Menggunakan Supabase Client (Recommended)

Lebih baik menggunakan Supabase client yang sudah handle Authorization otomatis:

```typescript
import { supabase } from '../services/supabase';

// Recommended approach
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your data */ },
});
```

vs

```typescript
// Manual fetch (not recommended)
const response = await fetch(`${url}/functions/v1/function-name`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
    'apikey': publicAnonKey,
  },
  body: JSON.stringify(data),
});
```

## 🔒 Security Notes

1. **Public Anon Key**: Safe untuk digunakan di frontend
2. **Service Role Key**: Hanya untuk backend/Edge Functions (JANGAN expose ke frontend)
3. **User Access Token**: Untuk authenticated requests (dari `supabase.auth.getSession()`)

### Header Types

| Header Type | Use Case | Example |
|-------------|----------|---------|
| `publicAnonKey` | Public endpoints (signup, etc) | RegisterPage |
| `accessToken` | Authenticated endpoints | ExpertDashboard |
| `serviceRoleKey` | Backend only (webhooks, admin) | Edge Functions |

## 🧪 Testing

### Test Registration

```bash
# Should now work without 401 error
npm run dev
# Go to /register and create account
```

### Test Expert Dashboard

```bash
# Login as expert
# Access dashboard - should load profile data
```

## 🔍 How to Find Missing Headers

Use this grep command to find potential issues:

```bash
# Find fetch calls without Authorization
grep -r "fetch(" src/ | grep -v "Authorization"

# Find Edge Function calls
grep -r "functions/v1" src/
```

## 📚 Related Documentation

- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth)
- [Supabase Client Auth](https://supabase.com/docs/reference/javascript/auth-api)

## ✅ Verification Checklist

- [x] RegisterPage - Added Authorization header
- [x] ExpertDashboard - Already has Authorization header
- [x] ExpertTransactions - Already has Authorization header
- [x] MidtransPayment - Uses supabase.functions.invoke()
- [x] LoginPage - Not needed (uses Supabase auth directly)

---

**Fixed:** 2025-01-20
**Issue:** Missing Authorization header in Edge Function requests
**Status:** ✅ Resolved
