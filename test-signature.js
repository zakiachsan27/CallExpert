// Test signature calculation untuk validasi SERVER_KEY
const crypto = require('crypto');

// Data dari notification yang kamu terima (dari screenshot)
const order_id = "ORDER-1763907351143-URBVZI";
const transaction_status = "settlement";
const gross_amount = "100000"; // Sesuaikan dengan gross_amount di notification kamu

// MASUKKAN SERVER_KEY KAMU DI SINI (yang baru di-set di Supabase)
const server_key = "PASTE_SERVER_KEY_KAMU_DISINI";

// Signature dari Midtrans (dari screenshot)
const midtrans_signature = "b22b524552db8529fbd7b0aed04dbfd4f9f07ec7978b74279cf8dccf26802e23b1492171935...";

// Calculate signature (sama seperti di webhook)
const signatureString = order_id + transaction_status + gross_amount + server_key;
const hash = crypto.createHash('sha512').update(signatureString).digest('hex');

console.log('=== SIGNATURE VALIDATION TEST ===');
console.log('Order ID:', order_id);
console.log('Transaction Status:', transaction_status);
console.log('Gross Amount:', gross_amount);
console.log('');
console.log('Server Key (first 20 chars):', server_key.substring(0, 20) + '...');
console.log('');
console.log('Calculated Signature:', hash);
console.log('Midtrans Signature  :', midtrans_signature);
console.log('');
console.log('Match:', hash === midtrans_signature ? '✅ YES - Server Key CORRECT!' : '❌ NO - Server Key WRONG!');
