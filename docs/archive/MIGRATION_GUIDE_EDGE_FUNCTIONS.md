# Migration Guide: Edge Functions Helper

Guide untuk migrasi dari manual fetch ke edge function helper utilities.

## 📦 New Helper Service

File: `src/services/edgeFunctions.ts`

Menyediakan:
1. ✅ `callEdgeFunction()` - Generic helper
2. ✅ `edgeFunctions` - Type-safe wrappers untuk common endpoints

## 🔄 Migration Examples

### Before & After

#### Example 1: User Signup

**Before (RegisterPage.tsx):**
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

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || 'Registrasi gagal');
}

const data = await response.json();
```

**After (Option 1 - Using wrapper):**
```typescript
import { edgeFunctions } from '../services/edgeFunctions';

const data = await edgeFunctions.signup(email, password, name);
```

**After (Option 2 - Using generic helper):**
```typescript
import { callEdgeFunction } from '../services/edgeFunctions';

const data = await callEdgeFunction('make-server-92eeba71', '/user/signup', {
  method: 'POST',
  body: { email, password, name }
});
```

#### Example 2: Get Expert Profile

**Before (ExpertDashboard.tsx):**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/profile`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch profile');
}

const data = await response.json();
```

**After:**
```typescript
import { edgeFunctions } from '../services/edgeFunctions';

const data = await edgeFunctions.getExpertProfile(accessToken);
```

#### Example 3: Update Expert Profile

**Before (ExpertDashboard.tsx):**
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/profile`,
  {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(updatedProfile)
  }
);

if (!response.ok) {
  throw new Error('Failed to save profile');
}
```

**After:**
```typescript
import { edgeFunctions } from '../services/edgeFunctions';

await edgeFunctions.updateExpertProfile(accessToken, updatedProfile);
```

## ✨ Benefits

### 1. Cleaner Code
- Less boilerplate
- More readable
- Consistent error handling

### 2. Type Safety
- TypeScript autocomplete
- Type checking for parameters
- Better IDE support

### 3. Centralized Configuration
- Single source of truth for headers
- Easy to update authentication logic
- Consistent URL building

### 4. Error Handling
- Unified error handling
- Better error messages
- Easier debugging

## 📋 Migration Checklist

Optional migration (files masih berfungsi dengan baik tanpa migration):

### RegisterPage.tsx
- [ ] Import `edgeFunctions`
- [ ] Replace fetch with `edgeFunctions.signup()`
- [ ] Remove manual error handling
- [ ] Test signup flow

### ExpertDashboard.tsx
- [ ] Import `edgeFunctions`
- [ ] Replace `fetchExpertProfile()` fetch
- [ ] Replace `handleSaveProfile()` fetch
- [ ] Replace `updateAvailabilityStatus()` fetch
- [ ] Test all profile operations

### ExpertTransactions.tsx
- [ ] Import `edgeFunctions`
- [ ] Replace `fetchTransactions()` fetch
- [ ] Replace `handleWithdrawSubmit()` fetch
- [ ] Test transaction flows

## 🎯 When to Migrate

### Migrate Now (Recommended):
- ✅ New features being developed
- ✅ Major refactoring of existing code
- ✅ Adding new Edge Function endpoints

### Can Wait:
- ⏸️ Code is working fine and stable
- ⏸️ Low priority features
- ⏸️ No active development on the file

## 📝 Adding New Endpoints

When adding new Edge Function endpoints:

```typescript
// In src/services/edgeFunctions.ts

export const edgeFunctions = {
  // ... existing functions ...

  /**
   * Your new endpoint
   */
  myNewEndpoint: async (accessToken: string, data: MyDataType) => {
    return callEdgeFunction('function-name', '/endpoint', {
      method: 'POST',
      accessToken,
      body: data,
    });
  },
};
```

## 🧪 Testing After Migration

```typescript
// Test helper imports
import { edgeFunctions, callEdgeFunction } from '../services/edgeFunctions';

// Test type-safe wrapper
const result = await edgeFunctions.signup('test@example.com', 'password', 'Test User');

// Test generic helper
const customResult = await callEdgeFunction('my-function', '/endpoint', {
  method: 'POST',
  body: { test: true }
});
```

## 🔍 Finding Migration Candidates

Search for manual fetch calls:

```bash
# Find all fetch to edge functions
grep -r "functions/v1" src/ --include="*.tsx" --include="*.ts"

# Find fetch without helper
grep -r "fetch.*functions/v1" src/ --include="*.tsx" --include="*.ts"
```

## ⚠️ Important Notes

1. **Backward Compatible**: Old code will continue to work
2. **No Breaking Changes**: Migration is optional
3. **Gradual Migration**: Migrate file by file as needed
4. **Test Thoroughly**: Test each migrated endpoint

## 📚 References

- [FIXES_AUTHORIZATION.md](./FIXES_AUTHORIZATION.md) - Authorization header fix
- [src/services/edgeFunctions.ts](./src/services/edgeFunctions.ts) - Helper implementation

---

**Created:** 2025-01-20
**Status:** Optional Migration - No Breaking Changes
