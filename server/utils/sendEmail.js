import nodemailer from 'nodemailer';

/**
 * Sends an email via Brevo SMTP relay.
 *
 * Uses Nodemailer + Brevo SMTP (smtp-relay.brevo.com:587).
 * This works on Render (no SMTP port blocking unlike Vercel).
 * Brevo free tier: 300 emails/day to ANY recipient.
 *
 * Required env vars:
 *   EMAIL_USER   — Brevo SMTP login (e.g. afb009001@smtp-brevo.com)
 *   EMAIL_PASS   — Brevo SMTP key
 *   SENDER_EMAIL — The verified "from" address (e.g. aditya.patiyal007@gmail.com)
 */

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[sendEmail] EMAIL_USER or EMAIL_PASS not set — skipping.');
    return false;
  }

  const from = `"GymPulse" <${process.env.SENDER_EMAIL || process.env.EMAIL_USER}>`;
  console.log(`[sendEmail] Sending | from: ${from} | to: ${to} | subject: ${subject}`);

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({ from, to, subject, html });
    console.log('[sendEmail] Sent successfully. Response:', info.response);
    return true;
  } catch (err) {
    console.error('[sendEmail] Failed:', err.message);
    return false;
  }
};
