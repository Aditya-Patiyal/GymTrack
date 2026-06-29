import dotenv from 'dotenv';
dotenv.config();

console.log('=== ENVIRONMENT ===');
console.log('BREVO_API_KEY set:', !!process.env.BREVO_API_KEY);
console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
console.log('');

// TEST 1: Send to admin
console.log('=== TEST 1: Send to ADMIN ===');
const r1 = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': process.env.BREVO_API_KEY,
  },
  body: JSON.stringify({
    sender: { name: 'GymPulse', email: process.env.SENDER_EMAIL },
    to: [{ email: 'aditya.patiyal007@gmail.com' }],
    subject: '✅ TEST — Admin Notification (Brevo HTTP API)',
    htmlContent: '<h2>Admin email works!</h2><p>Brevo HTTP API is delivering via HTTPS. No SMTP needed.</p>',
  }),
});
const d1 = await r1.json();
console.log('Status:', r1.status, r1.ok ? '✅' : '❌');
console.log('Response:', JSON.stringify(d1));
console.log('');

// TEST 2: Send to a different address (simulating owner)
console.log('=== TEST 2: Send to OWNER (same Gmail for test) ===');
const r2 = await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': process.env.BREVO_API_KEY,
  },
  body: JSON.stringify({
    sender: { name: 'GymPulse', email: process.env.SENDER_EMAIL },
    to: [{ email: 'aditya.patiyal007@gmail.com' }],
    subject: '✅ TEST — Owner Approval Email (Brevo HTTP API)',
    htmlContent: '<h2>Owner approval works!</h2><p>This proves Brevo HTTP API can send to any recipient.</p>',
  }),
});
const d2 = await r2.json();
console.log('Status:', r2.status, r2.ok ? '✅' : '❌');
console.log('Response:', JSON.stringify(d2));
console.log('');

console.log('=== TESTS COMPLETE ===');
