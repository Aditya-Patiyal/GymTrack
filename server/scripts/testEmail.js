import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('EMAIL_USER (Brevo login):', process.env.EMAIL_USER);
console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
console.log('SENDER_EMAIL (from address):', process.env.SENDER_EMAIL);

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('\nVerifying SMTP connection to Brevo...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection FAILED:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection OK! Sending test email...');
    transporter.sendMail({
      from: `"GymPulse Test" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL, // send to yourself
      subject: '✅ GymPulse Brevo Email Test',
      html: '<p>This is a test email via <strong>Brevo SMTP</strong> from GymPulse. If you see this, emails will work on Vercel!</p>',
    }, (err, info) => {
      if (err) {
        console.error('❌ Send FAILED:', err.message);
      } else {
        console.log('✅ Email sent successfully!', info.response);
      }
      process.exit(0);
    });
  }
});
