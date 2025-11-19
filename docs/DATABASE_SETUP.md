# CallExpert Database Setup Guide

This guide will help you set up the Supabase database for the CallExpert platform.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created
3. Node.js installed for running admin scripts

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
   - **anon public key**: Used for client-side operations
   - **service_role key**: Used for admin operations (keep secret!)

## Step 2: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

2. Update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Note:** The `src/utils/supabase/info.tsx` file already contains the project ID and anon key. If you want to use environment variables instead, you'll need to update that file.

## Step 3: Run Database Migrations

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the SQL migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_setup.sql`
4. Copy the contents of each file into the SQL Editor
5. Click **Run** to execute each migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

## Step 4: Verify Database Setup

After running the migrations, verify that the following tables exist in your Supabase dashboard:

### Tables
- `users`
- `experts`
- `expert_expertise`
- `expert_skills`
- `expert_achievements`
- `expert_education`
- `expert_work_experience`
- `session_types`
- `digital_products`
- `bookings`
- `reviews`

### Storage Buckets
- `avatars` (public)
- `product-images` (public)

To check:
1. Go to **Table Editor** to see all tables
2. Go to **Storage** to see buckets

## Step 5: Create Your First Expert Account

Use the admin script to create an expert account:

```bash
# Install dependencies first
npm install

# Run the create expert script
npm run create-expert
```

Follow the prompts to enter:
- Email
- Password
- Full Name
- Role/Title
- Company
- Bio
- City
- Country

The script will create:
1. An authentication user
2. A user record
3. An expert profile

## Step 6: Verify Setup

1. **Check Auth Users:**
   - Go to **Authentication** > **Users** in Supabase dashboard
   - You should see the expert user you created

2. **Check Expert Profile:**
   - Go to **Table Editor** > **experts**
   - You should see the expert profile

3. **Test Login:**
   - Run `npm run dev`
   - Navigate to `/expert/login`
   - Login with the credentials you created

## Database Schema Overview

### Core Tables

#### `users`
Stores basic user information for both regular users and experts.

#### `experts`
Extended profile for expert users. Linked to `users` via `user_id`.

#### Expert Related Tables
- `expert_expertise`: Skills and areas of expertise
- `expert_skills`: Technical skills
- `expert_achievements`: Notable achievements
- `expert_education`: Educational background
- `expert_work_experience`: Work history

#### `session_types`
Different types of consultation sessions offered by experts:
- `online-chat`: Chat consultation
- `online-video`: Video call consultation
- `online-event`: Group online event
- `offline-event`: In-person meeting

#### `digital_products`
Digital products sold by experts (e-books, courses, templates, etc.)

#### `bookings`
Consultation booking records with status tracking:
- Status: `pending`, `confirmed`, `cancelled`, `completed`
- Payment status: `waiting`, `paid`, `refunded`

#### `reviews`
User reviews and ratings for completed bookings.

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Public read access**: Expert profiles, session types, digital products
- **User permissions**: Users can manage their own bookings and reviews
- **Expert permissions**: Experts can manage their own profiles and see their bookings
- **Admin permissions**: Service role can manage everything

## Common Issues

### Issue: Migration fails with "relation already exists"

**Solution:** The table already exists. Skip that part of the migration or drop the table first (be careful with data loss).

### Issue: Storage bucket creation fails

**Solution:** Buckets might already exist. Check the Storage section in Supabase dashboard.

### Issue: RLS policies prevent access

**Solution:** Check that you're authenticated and using the correct role. Service role key bypasses RLS.

### Issue: Expert login fails

**Solution:** 
1. Verify the expert profile exists in the `experts` table
2. Verify the user has `role='expert'` in user metadata
3. Check that `user_id` in experts table matches the auth user ID

## Maintenance

### Backing Up Data

```sql
-- Export experts
SELECT * FROM experts;

-- Export bookings
SELECT * FROM bookings;
```

### Resetting Database (Development Only)

**⚠️ Warning: This will delete all data!**

```sql
-- Drop all tables (run in reverse order)
DROP TABLE reviews CASCADE;
DROP TABLE bookings CASCADE;
DROP TABLE digital_products CASCADE;
DROP TABLE session_types CASCADE;
DROP TABLE expert_work_experience CASCADE;
DROP TABLE expert_education CASCADE;
DROP TABLE expert_achievements CASCADE;
DROP TABLE expert_skills CASCADE;
DROP TABLE expert_expertise CASCADE;
DROP TABLE experts CASCADE;
DROP TABLE users CASCADE;
```

Then re-run the migrations.

## Next Steps

After setting up the database:

1. **Create Test Expert Accounts** - Use `npm run create-expert`
2. **Populate Expert Profiles** - Add expertise, skills, session types via Expert Dashboard
3. **Test User Flow** - Create user account and test booking
4. **Configure Storage** - Test avatar and product image uploads
5. **Set Up Payment Integration** - Add payment gateway (future step)

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- Check the `src/services/database.ts` file for available database functions

---

**Last Updated:** November 2024

