import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email via Resend HTTP API.
 * HTTP-based — works 100% on Vercel serverless (no SMTP port restrictions).
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[sendEmail] RESEND_API_KEY not set — skipping email send.');
    return false;
  }

  const from = process.env.SENDER_EMAIL
    ? `GymPulse <${process.env.SENDER_EMAIL}>`
    : 'GymPulse <onboarding@resend.dev>';

  console.log(`[sendEmail] Sending | from: ${from} | to: ${to} | subject: ${subject}`);

  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html });

    if (error) {
      console.error('[sendEmail] Resend API error:', JSON.stringify(error));
      return false;
    }

    console.log('[sendEmail] Sent successfully. ID:', data?.id);
    return true;
  } catch (err) {
    console.error('[sendEmail] Unexpected error:', err.message);
    return false;
  }
};
