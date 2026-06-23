import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('\nVerifying SMTP connection...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection FAILED:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ SMTP Connection OK! Sending test email...');
    transporter.sendMail({
      from: `"GymPulse Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'GymPulse Email Test',
      html: '<p>This is a test email from GymPulse to verify Nodemailer is working.</p>',
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
