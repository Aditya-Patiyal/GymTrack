import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);
console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('\nVerifying Brevo SMTP connection...');
try {
  await transporter.verify();
  console.log('✅ SMTP connection OK!');
} catch (err) {
  console.error('❌ SMTP connection failed:', err.message);
  process.exit(1);
}

// Test sending to the admin email
console.log('\nSending test email to admin...');
const result = await transporter.sendMail({
  from: `"GymPulse" <${process.env.SENDER_EMAIL}>`,
  to: process.env.SENDER_EMAIL,
  subject: '✅ GymPulse Brevo Test — Admin Notification',
  html: '<h2>Admin email works!</h2><p>Brevo SMTP is delivering to the super admin address.</p>',
});
console.log('✅ Admin email sent:', result.response);

process.exit(0);
