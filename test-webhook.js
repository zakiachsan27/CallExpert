// Test Midtrans Webhook manually
// Run with: node test-webhook.js

const orderId = 'ORDER-1763903452364-JMRHR0'; // Replace with your actual order ID from console

// Simulated Midtrans notification
const notification = {
  transaction_time: "2025-11-23 20:10:32",
  transaction_status: "settlement",
  transaction_id: "02f13792-31c7-4325-a2a7-18fcaafa9404",
  status_message: "Success, transaction is found",
  status_code: "200",
  signature_key: "...", // Will be calculated
  settlement_time: "2025-11-23 20:11:30",
  payment_type: "credit_card",
  order_id: orderId,
  merchant_id: "G568229318",
  masked_card: "481111-1114",
  gross_amount: "10000.00",
  fraud_status: "accept",
  eci: "05",
  currency: "IDR",
  channel_response_message: "Approved",
  channel_response_code: "00",
  card_type: "credit",
  bank: "bni",
  approval_code: "1732386690382"
};

// Calculate signature (simplified - use actual crypto in production)
const crypto = require('crypto');
const serverKey = 'SB-Mid-server-YffyiHB2xaoEkOz4SRqPADP-'; // Your sandbox server key

const signatureString = notification.order_id + notification.status_code + notification.gross_amount + serverKey;
const signature = crypto.createHash('sha512').update(signatureString).digest('hex');

notification.signature_key = signature;

console.log('Testing webhook with notification:', JSON.stringify(notification, null, 2));
console.log('\nCalculated signature:', signature);

// Send POST request to webhook
fetch('https://xnnlpwaodduqqiffeyxw.supabase.co/functions/v1/midtrans-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(notification)
})
  .then(response => response.json())
  .then(data => {
    console.log('\n✅ Webhook Response:', data);
  })
  .catch(error => {
    console.error('\n❌ Webhook Error:', error);
  });
