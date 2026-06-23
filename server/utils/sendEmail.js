import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Use explicit SMTP settings instead of 'service: gmail'
// for more reliable behaviour in serverless environments (Vercel)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,        // use STARTTLS
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends an email with a 10-second timeout guard.
 * Safe to await in serverless environments — never hangs indefinitely.
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('EMAIL_USER or EMAIL_PASS not set — skipping email send.');
    return false;
  }

  const mailOptions = {
    from: `"GymPulse" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  // Race the email send against a 10-second timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Email send timed out after 10s')), 10000)
  );

  try {
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      timeoutPromise,
    ]);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Email failed:', error.message);
    return false;
  }
};
