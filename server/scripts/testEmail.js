import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('\nSending test email via Resend...');

const { data, error } = await resend.emails.send({
  from: 'GymPulse <onboarding@resend.dev>',
  to: [process.env.SENDER_EMAIL || 'aditya.patiyal007@gmail.com'],
  subject: '✅ GymPulse Resend Email Test',
  html: '<h2>It works! 🎉</h2><p>Resend HTTP API is correctly configured for GymPulse. Emails will work on Vercel.</p>',
});

if (error) {
  console.error('❌ Resend error:', JSON.stringify(error, null, 2));
  process.exit(1);
} else {
  console.log('✅ Email sent successfully! Resend ID:', data?.id);
  process.exit(0);
}
