#!/usr/bin/env ts-node

/**
 * Admin Script: Create Expert Account
 * 
 * This script creates a new expert account in the CallExpert platform.
 * Only admins should run this script.
 * 
 * Usage: npm run create-expert
 */

import * as readline from 'readline';
import { createClient } from '@supabase/supabase-js';

// Read from environment or hardcoded (for admin use only)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xnnlpwaodduqqiffeyxw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('This key should be the service_role key (not anon key) from Supabase dashboard');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createExpert() {
  console.log('\n🚀 CallExpert - Create New Expert Account\n');
  console.log('This script will create a new expert account in the system.\n');

  try {
    // Collect expert information
    const email = await question('📧 Expert Email: ');
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    const password = await question('🔐 Password (min 6 characters): ');
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const name = await question('👤 Full Name: ');
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const role = await question('💼 Role/Title (e.g., Senior Product Manager): ');
    const company = await question('🏢 Company: ');
    const bio = await question('📝 Short Bio: ');
    const city = await question('🌆 City: ');
    const country = await question('🌍 Country: ');

    console.log('\n⏳ Creating expert account...\n');

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'expert'
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user data returned from auth creation');
    }

    console.log('✅ Auth user created:', authData.user.id);

    // 2. Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name
      });

    if (userError) {
      console.error('❌ Failed to create user record:', userError.message);
      // Try to delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    console.log('✅ User record created');

    // 3. Create expert profile
    const { data: expertData, error: expertError } = await supabase
      .from('experts')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        role,
        company,
        bio,
        location_city: city,
        location_country: country,
        availability: 'online',
        is_active: true
      })
      .select()
      .single();

    if (expertError) {
      console.error('❌ Failed to create expert profile:', expertError.message);
      // Try to delete user and auth user
      await supabase.from('users').delete().eq('id', authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw expertError;
    }

    console.log('✅ Expert profile created:', expertData.id);

    // Success!
    console.log('\n✨ Expert account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   - User ID:', authData.user.id);
    console.log('   - Expert ID:', expertData.id);
    console.log('   - Email:', email);
    console.log('   - Name:', name);
    console.log('   - Role:', role);
    console.log('   - Company:', company);
    console.log('\n💡 The expert can now log in at /expert/login\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    console.log('\n⚠️  No account was created.\n');
  } finally {
    rl.close();
  }
}

// Run the script
createExpert();

