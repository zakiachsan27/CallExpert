# Expert Dashboard - Implementation Status

## Completed Features ✅

1. **Database Schema** - All tables created
2. **Database Service Layer** - CRUD functions available in `src/services/database.ts`
3. **Storage Service Layer** - File upload functions in `src/services/storage.ts`
4. **Auth Integration** - Expert authentication working

## Partially Implemented Features ⚠️

### ExpertDashboard.tsx

The ExpertDashboard component (1300+ lines) has the UI complete but needs database integration for the following operations:

#### 1. Fetch Expert Profile
**Location:** `ExpertDashboard.tsx` - `useEffect` hook
**Current:** Uses demo data
**Needed:** 
```typescript
import { getExpertById, getExpertByUserId } from '../services/database';

// In useEffect
const expert = await getExpertByUserId(userId);
if (expert) {
  // Populate all state variables from expert data
  setName(expert.name);
  setEmail(expert.email);
  // ... etc
}
```

#### 2. Save Profile Changes
**Location:** `handleSaveProfile()` function
**Current:** Logs to console only
**Needed:**
```typescript
import { updateExpertProfile } from '../services/database';

const handleSaveProfile = async () => {
  setIsSaving(true);
  try {
    await updateExpertProfile(expertId, {
      name,
      email,
      bio,
      company,
      role,
      experience,
      location_city: locationCity,
      location_country: locationCountry,
      location_address: locationAddress,
      availability
    });
    setSaveSuccess(true);
  } catch (error) {
    setError('Failed to save profile');
  } finally {
    setIsSaving(false);
  }
};
```

#### 3. Upload Avatar
**Location:** `handleAvatarChange()` function
**Current:** Sets preview only
**Needed:**
```typescript
import { uploadAvatar } from '../services/storage';
import { updateExpertProfile } from '../services/database';

const handleAvatarUpload = async () => {
  if (!avatarFile || !userId) return;
  
  const avatarUrl = await uploadAvatar(avatarFile, userId);
  await updateExpertProfile(expertId, { avatar_url: avatarUrl });
  setAvatar(avatarUrl);
};
```

#### 4. Add/Delete Expertise
**Location:** `handleAddExpertise()`, delete handler
**Needed:**
```typescript
import { addExpertise, deleteExpertise } from '../services/database';

const handleAddExpertise = async () => {
  if (!newExpertise.trim()) return;
  const id = await addExpertise(expertId, newExpertise.trim());
  setExpertise([...expertise, newExpertise.trim()]);
  setNewExpertise('');
};

const handleDeleteExpertise = async (item: string, id: string) => {
  await deleteExpertise(id);
  setExpertise(expertise.filter(e => e !== item));
};
```

#### 5. Add/Delete Skills
**Similar to expertise above**

#### 6. Add/Delete Achievements
**Similar to expertise above**

#### 7. Add/Delete Education
**Similar to expertise above**

#### 8. Add/Delete Work Experience
**Needed:**
```typescript
import { addWorkExperience, deleteWorkExperience } from '../services/database';

const handleAddWorkExperience = async () => {
  const id = await addWorkExperience(expertId, {
    title: newWorkExp.title,
    company: newWorkExp.company,
    period: newWorkExp.period,
    description: newWorkExp.description
  });
  // Add to state...
};
```

#### 9. Session Types CRUD
**Location:** Session Types tab
**Needed:**
```typescript
import { createSessionType, updateSessionType, deleteSessionType } from '../services/database';

const handleAddSessionType = async () => {
  const id = await createSessionType(expertId, {
    name: newSessionType.name,
    duration: newSessionType.duration,
    price: newSessionType.price,
    category: newSessionType.category,
    description: newSessionType.description
  });
  // Add to state...
};

const handleDeleteSessionType = async (id: string) => {
  await deleteSessionType(id);
  // Remove from state...
};
```

#### 10. Digital Products CRUD
**Location:** Digital Products tab
**Needed:**
```typescript
import { createDigitalProduct, updateDigitalProduct, deleteDigitalProduct } from '../services/database';
import { uploadProductImage } from '../services/storage';

const handleAddDigitalProduct = async () => {
  let thumbnailUrl;
  if (productImageFile) {
    thumbnailUrl = await uploadProductImage(productImageFile, productId);
  }
  
  const id = await createDigitalProduct(expertId, {
    name: newProduct.name,
    description: newProduct.description,
    price: newProduct.price,
    type: newProduct.type,
    download_link: newProduct.downloadLink,
    thumbnail_url: thumbnailUrl
  });
  // Add to state...
};
```

#### 11. Resume Upload & Auto-fill
**Location:** Resume upload section
**Status:** UI exists, needs AI/parsing integration
**Note:** This requires additional service (OpenAI API, custom parser, etc.)

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ Fetch expert profile on load
2. ✅ Save basic profile changes
3. ✅ Upload avatar
4. ✅ Session types CRUD
5. ✅ Digital products CRUD

### Medium Priority (Enhanced Profile)
6. Expertise/Skills CRUD (already has functions)
7. Achievements CRUD
8. Education CRUD
9. Work Experience CRUD

### Low Priority (Nice to Have)
10. Resume upload & auto-fill (requires AI integration)
11. Bulk operations
12. Export profile data

## Quick Implementation Guide

### Step 1: Add Imports
Add to the top of `ExpertDashboard.tsx`:
```typescript
import { useAuth } from '../contexts/AuthContext';
import {
  getExpertByUserId,
  updateExpertProfile,
  createSessionType,
  updateSessionType,
  deleteSessionType,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  addExpertise,
  deleteExpertise,
  addSkill,
  deleteSkill,
  addAchievement,
  deleteAchievement,
  addEducation,
  deleteEducation,
  addWorkExperience,
  deleteWorkExperience
} from '../services/database';
import { uploadAvatar, uploadProductImage } from '../services/storage';
```

### Step 2: Update useEffect to Fetch Data
Replace demo data fetch with real database call

### Step 3: Update Each Handler Function
Replace `console.log()` calls with actual database operations

### Step 4: Add Error Handling
Wrap all async operations in try-catch blocks

### Step 5: Add Loading States
Show loading spinners during save operations

### Step 6: Test Each Operation
- Create expert account
- Login as expert
- Edit profile
- Add/edit session types
- Add/edit products
- Upload images

## Available Database Functions

All functions are available in `src/services/database.ts`:

**Expert Profile:**
- `getExpertById(id)`
- `getExpertByUserId(userId)`
- `updateExpertProfile(id, data)`

**Expert Details:**
- `addExpertise(expertId, name)` / `deleteExpertise(id)`
- `addSkill(expertId, name)` / `deleteSkill(id)`
- `addAchievement(expertId, description)` / `deleteAchievement(id)`
- `addEducation(expertId, description)` / `deleteEducation(id)`
- `addWorkExperience(expertId, data)` / `deleteWorkExperience(id)`

**Session Types:**
- `createSessionType(expertId, data)`
- `updateSessionType(id, data)`
- `deleteSessionType(id)` (soft delete)

**Digital Products:**
- `createDigitalProduct(expertId, data)`
- `updateDigitalProduct(id, data)`
- `deleteDigitalProduct(id)` (soft delete)

**Storage:**
- `uploadAvatar(file, userId)`
- `uploadProductImage(file, productId)`

## Testing Checklist

- [ ] Fetch expert profile on dashboard load
- [ ] Edit and save basic info (name, bio, company, role)
- [ ] Upload avatar image
- [ ] Add new session type
- [ ] Edit existing session type
- [ ] Delete session type
- [ ] Add digital product
- [ ] Upload product thumbnail
- [ ] Delete digital product
- [ ] Add expertise tags
- [ ] Remove expertise tags
- [ ] View changes reflected in public expert profile

## Notes

- All database operations are asynchronous
- Use proper error handling and user feedback
- Consider implementing optimistic updates for better UX
- Add confirmation dialogs for delete operations
- Implement undo functionality for critical operations
- Add auto-save functionality for better UX

---

**Status:** Database layer complete, UI integration needed
**Estimated Time:** 4-6 hours for full implementation
**Last Updated:** November 2024

