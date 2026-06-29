import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('=== ENVIRONMENT ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);
console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
console.log('');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Step 1: Verify connection
console.log('=== STEP 1: Verify SMTP Connection ===');
try {
  await transporter.verify();
  console.log('✅ SMTP connection OK\n');
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}

// Step 2: Send to admin (your Gmail)
console.log('=== STEP 2: Send to ADMIN (aditya.patiyal007@gmail.com) ===');
try {
  const r1 = await transporter.sendMail({
    from: `"GymPulse" <${process.env.SENDER_EMAIL}>`,
    to: 'aditya.patiyal007@gmail.com',
    subject: '✅ TEST — Admin Registration Notification',
    html: '<h2>Admin email works!</h2><p>This simulates the registration notification to super admin.</p>',
  });
  console.log('✅ Sent:', r1.response, '\n');
} catch (err) {
  console.error('❌ Failed:', err.message, '\n');
}

// Step 3: Send to a DIFFERENT email (simulating owner approval email)
// Using the same admin email as the "owner" for testing since we need a real inbox
console.log('=== STEP 3: Send to OWNER (simulated — also sending to admin for testing) ===');
try {
  const r2 = await transporter.sendMail({
    from: `"GymPulse" <${process.env.SENDER_EMAIL}>`,
    to: 'aditya.patiyal007@gmail.com',
    subject: '✅ TEST — Owner Approval Email',
    html: '<h2>Owner approval email works!</h2><p>This simulates the approval notification sent to a gym owner.</p>',
  });
  console.log('✅ Sent:', r2.response, '\n');
} catch (err) {
  console.error('❌ Failed:', err.message, '\n');
}

console.log('=== ALL TESTS COMPLETE ===');
process.exit(0);
