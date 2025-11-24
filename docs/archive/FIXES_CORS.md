# Fix: CORS Headers untuk Supabase Edge Functions

## 🐛 Problem

CORS error saat memanggil Edge Function dari frontend:
```
Access to fetch at '...make-server-92eeba71/user/signup' from origin 'http://localhost:3000'
has been blocked by CORS policy: Request header field apikey is not allowed by
Access-Control-Allow-Headers in preflight response.
```

## 🔍 Root Cause

Edge Function `make-server-92eeba71` tidak include `apikey` dan `x-client-info` dalam CORS allowed headers.

## ✅ Solution

Update CORS configuration di Hono middleware untuk allow semua headers yang dibutuhkan Supabase.

## 📝 File yang Diperbaiki

### 1. make-server-92eeba71/index.ts

**Before:**
```typescript
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);
```

**After:**
```typescript
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);
```

### Changes Made:

1. ✅ Added `"apikey"` to `allowHeaders`
2. ✅ Added `"x-client-info"` to `allowHeaders`
3. ✅ Added `"PATCH"` to `allowMethods`
4. ✅ Added `credentials: true` for authenticated requests

## ✅ Files Already Correct

### create-snap-token/index.ts
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```
✅ Already includes all required headers

### midtrans-webhook/index.ts
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```
✅ Already includes all required headers

## 📋 Standard CORS Headers untuk Supabase Edge Functions

### Using Hono (like make-server-92eeba71):

```typescript
import { cors } from "npm:hono/cors";

app.use(
  "/*",
  cors({
    origin: "*", // or specify your domain for production
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "x-client-info"
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);
```

### Using Standard Deno serve (like create-snap-token, midtrans-webhook):

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ... your logic ...

  // Always include CORS headers in response
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
});
```

## 🔒 Security Notes

### Production CORS Settings

For production, consider restricting `origin`:

```typescript
// Development
origin: "*"

// Production
origin: "https://yourdomain.com"

// Multiple domains
origin: (origin) => {
  const allowedOrigins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://app.yourdomain.com"
  ];
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}
```

### Required Headers Explanation

| Header | Purpose |
|--------|---------|
| `Content-Type` | Specify request body format (application/json) |
| `Authorization` | Bearer token for authentication |
| `apikey` | Supabase anon/public key |
| `x-client-info` | Supabase client information |

## 🧪 Testing

### Test CORS Preflight

```bash
# Test OPTIONS request (preflight)
curl -X OPTIONS \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-92eeba71/user/signup \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type" \
  -H "Origin: http://localhost:3000" \
  -v
```

Should return:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
```

### Test Actual Request

```bash
# Test POST request with all headers
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-92eeba71/user/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## 🚀 Deployment

After fixing CORS, deploy the updated Edge Function:

```bash
supabase functions deploy make-server-92eeba71
```

## ✅ Verification Checklist

- [x] CORS headers include `apikey`
- [x] CORS headers include `x-client-info`
- [x] CORS headers include `Authorization`
- [x] CORS headers include `Content-Type`
- [x] All HTTP methods included (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- [x] OPTIONS method handled for preflight
- [x] CORS headers included in all responses
- [x] Tested from browser (localhost:3000)
- [ ] Deploy to production
- [ ] Test from production domain

## 🔍 Debugging CORS Issues

### Check Browser Console

Look for these errors:
```
✅ Good: Request completes successfully
❌ Bad: "...blocked by CORS policy: Request header field apikey is not allowed..."
```

### Check Network Tab

1. Look for OPTIONS request (preflight)
2. Check Response Headers:
   - `Access-Control-Allow-Headers` should include `apikey`
   - `Access-Control-Allow-Origin` should be `*` or your domain

### Check Edge Function Logs

```bash
supabase functions logs make-server-92eeba71
```

## 📚 Related Documentation

- [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Hono CORS Middleware](https://hono.dev/middleware/builtin/cors)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 📝 Common CORS Errors & Solutions

### Error: "Request header field apikey is not allowed"
**Solution:** Add `apikey` to `allowHeaders`

### Error: "Request header field x-client-info is not allowed"
**Solution:** Add `x-client-info` to `allowHeaders`

### Error: "Method PATCH is not allowed"
**Solution:** Add `PATCH` to `allowMethods`

### Error: "Origin http://localhost:3000 is not allowed"
**Solution:** Set `origin: "*"` for development or whitelist specific origins

## ⚠️ Important Notes

1. **Always handle OPTIONS**: CORS preflight requires OPTIONS method handling
2. **Include CORS in all responses**: Not just errors, but success responses too
3. **Test from actual frontend**: curl != browser CORS behavior
4. **Production security**: Restrict origins in production

---

**Fixed:** 2025-01-20
**Issue:** CORS blocking `apikey` header
**Status:** ✅ Resolved
