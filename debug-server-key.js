// Script untuk validasi SERVER_KEY
// Jalankan: node debug-server-key.js

const crypto = require('crypto');

console.log('=== MIDTRANS SERVER KEY DEBUGGER ===\n');

// INSTRUKSI:
// 1. Ganti SERVER_KEY_FROM_MIDTRANS dengan Server Key dari Midtrans Dashboard
// 2. Ganti SERVER_KEY_FROM_SUPABASE dengan hasil dari: supabase secrets list
//    (atau tanya ke Supabase support untuk lihat actual value)

const SERVER_KEY_FROM_MIDTRANS = "PASTE_DARI_MIDTRANS_DASHBOARD";
const SERVER_KEY_FROM_SUPABASE = "PASTE_DARI_SUPABASE_SECRETS";

// Test data (gunakan data dari notification yang gagal)
const order_id = "ORDER-1763907351143-URBVZI";
const transaction_status = "settlement";
const gross_amount = "100000"; // ⚠️ SESUAIKAN dengan gross_amount di notification

console.log('📋 Test Data:');
console.log('  Order ID:', order_id);
console.log('  Status:', transaction_status);
console.log('  Amount:', gross_amount);
console.log('');

// Test 1: Basic validation
console.log('🔍 Test 1: Basic Validation');
console.log('  Midtrans Key Length:', SERVER_KEY_FROM_MIDTRANS.length);
console.log('  Supabase Key Length:', SERVER_KEY_FROM_SUPABASE.length);
console.log('  Keys Match:', SERVER_KEY_FROM_MIDTRANS === SERVER_KEY_FROM_SUPABASE ? '✅' : '❌');
console.log('');

// Test 2: Character-by-character comparison
if (SERVER_KEY_FROM_MIDTRANS !== SERVER_KEY_FROM_SUPABASE) {
  console.log('🔍 Test 2: Character Comparison');
  const maxLen = Math.max(SERVER_KEY_FROM_MIDTRANS.length, SERVER_KEY_FROM_SUPABASE.length);
  let diffCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const charMidtrans = SERVER_KEY_FROM_MIDTRANS[i] || '(empty)';
    const charSupabase = SERVER_KEY_FROM_SUPABASE[i] || '(empty)';

    if (charMidtrans !== charSupabase) {
      console.log(`  Position ${i}: Midtrans='${charMidtrans}' (${charMidtrans.charCodeAt(0)}) vs Supabase='${charSupabase}' (${charSupabase.charCodeAt(0)})`);
      diffCount++;
    }
  }

  console.log(`  Total differences: ${diffCount}`);
  console.log('');
}

// Test 3: Whitespace check
console.log('🔍 Test 3: Whitespace Check');
console.log('  Midtrans has leading space:', SERVER_KEY_FROM_MIDTRANS[0] === ' ' ? '❌ YES!' : '✅ No');
console.log('  Midtrans has trailing space:', SERVER_KEY_FROM_MIDTRANS[SERVER_KEY_FROM_MIDTRANS.length - 1] === ' ' ? '❌ YES!' : '✅ No');
console.log('  Supabase has leading space:', SERVER_KEY_FROM_SUPABASE[0] === ' ' ? '❌ YES!' : '✅ No');
console.log('  Supabase has trailing space:', SERVER_KEY_FROM_SUPABASE[SERVER_KEY_FROM_SUPABASE.length - 1] === ' ' ? '❌ YES!' : '✅ No');
console.log('');

// Test 4: Signature calculation dengan kedua key
console.log('🔍 Test 4: Signature Calculation');

// Dengan Midtrans key
const signatureString1 = order_id + transaction_status + gross_amount + SERVER_KEY_FROM_MIDTRANS;
const hash1 = crypto.createHash('sha512').update(signatureString1).digest('hex');

// Dengan Supabase key
const signatureString2 = order_id + transaction_status + gross_amount + SERVER_KEY_FROM_SUPABASE;
const hash2 = crypto.createHash('sha512').update(signatureString2).digest('hex');

console.log('  Signature with Midtrans key:');
console.log('   ', hash1);
console.log('');
console.log('  Signature with Supabase key:');
console.log('   ', hash2);
console.log('');

// Test 5: Compare dengan signature dari Midtrans notification
const SIGNATURE_FROM_NOTIFICATION = "b22b524552db8529fbd7b0aed04dbfd4f9f07ec7978b74279cf8dccf26802e23b1492171935";

console.log('🔍 Test 5: Match with Notification Signature');
console.log('  Signature from Midtrans notification:');
console.log('   ', SIGNATURE_FROM_NOTIFICATION);
console.log('');
console.log('  Match with Midtrans key calculation:', hash1 === SIGNATURE_FROM_NOTIFICATION ? '✅ YES!' : '❌ No');
console.log('  Match with Supabase key calculation:', hash2 === SIGNATURE_FROM_NOTIFICATION ? '✅ YES!' : '❌ No');
console.log('');

// Final recommendation
console.log('📌 RECOMMENDATION:');
if (SERVER_KEY_FROM_MIDTRANS === SERVER_KEY_FROM_SUPABASE) {
  console.log('   Keys are identical. Issue might be with gross_amount format.');
  console.log('   Try checking if notification sends "100000.00" instead of "100000"');
} else {
  console.log('   ❌ Keys are DIFFERENT!');
  console.log('   Action: Update Supabase secret with the correct key from Midtrans');
  console.log('   Command: supabase secrets set MIDTRANS_SERVER_KEY="<correct-key>"');
}
