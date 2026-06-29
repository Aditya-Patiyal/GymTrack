/**
 * Sends an email via Brevo HTTP API (REST).
 *
 * Uses HTTPS (port 443) — works on ALL hosting platforms
 * including Vercel, Render, Railway, etc. (no SMTP port blocking).
 * Brevo free tier: 300 emails/day to ANY recipient.
 *
 * Required env vars:
 *   BREVO_API_KEY  — Brevo REST API key (starts with xkeysib-...)
 *   SENDER_EMAIL   — The verified sender address (e.g. aditya.patiyal007@gmail.com)
 */
export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!apiKey) {
    console.error('[sendEmail] BREVO_API_KEY not set — skipping email.');
    return false;
  }

  if (!senderEmail) {
    console.error('[sendEmail] SENDER_EMAIL not set — skipping email.');
    return false;
  }

  console.log(`[sendEmail] Sending via Brevo HTTP API | to: ${to} | subject: ${subject}`);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'GymPulse', email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[sendEmail] ✅ Sent successfully. MessageId:', data.messageId);
      return true;
    } else {
      console.error('[sendEmail] ❌ Brevo API error:', response.status, JSON.stringify(data));
      return false;
    }
  } catch (err) {
    console.error('[sendEmail] ❌ Unexpected error:', err.message);
    return false;
  }
};
