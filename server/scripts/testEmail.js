import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// TEST 1: Using the custom SENDER_EMAIL (will likely FAIL)
console.log('\n=== TEST 1: Sending FROM aditya.patiyal007@gmail.com ===');
const test1 = await resend.emails.send({
  from: `GymPulse <${process.env.SENDER_EMAIL}>`,
  to: ['aditya.patiyal007@gmail.com'],
  subject: 'TEST 1 — Custom Sender (will likely fail)',
  html: '<p>This tests sending from your Gmail address.</p>',
});
console.log('Result:', JSON.stringify(test1, null, 2));

// TEST 2: Using onboarding@resend.dev (should SUCCEED)
console.log('\n=== TEST 2: Sending FROM onboarding@resend.dev ===');
const test2 = await resend.emails.send({
  from: 'GymPulse <onboarding@resend.dev>',
  to: ['aditya.patiyal007@gmail.com'],
  subject: 'TEST 2 — GymPulse Email Working! ✅',
  html: '<h2>It works!</h2><p>If you see this, your email system is functional.</p>',
});
console.log('Result:', JSON.stringify(test2, null, 2));
