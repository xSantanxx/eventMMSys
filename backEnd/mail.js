const nodemailer = require('nodemailer');
const { Resend } = require('resend');

function getMailCredentials() {
  const user = process.env.userEm?.trim();
  const pass = process.env.userPass?.replace(/\s/g, '');

  return { user, pass };
}

function getEmailProvider() {
  if (process.env.RESEND_API_KEY?.trim()) {
    return 'resend';
  }

  const { user, pass } = getMailCredentials();
  if (user && pass) {
    return 'gmail';
  }

  return null;
}

function createGmailTransporter() {
  const { user, pass } = getMailCredentials();

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

const gmailTransporter = createGmailTransporter();
const resendClient = process.env.RESEND_API_KEY?.trim()
  ? new Resend(process.env.RESEND_API_KEY.trim())
  : null;

async function sendWithResend({ to, eventName, qrBuffer }) {
  const from = process.env.RESEND_FROM?.trim() || 'Event System <onboarding@resend.dev>';

  const { error } = await resendClient.emails.send({
    from,
    to: [to],
    subject: `Confirmation Email for ${eventName}`,
    html: `<p>Here's your QR Code to be scanned in</p>
      <img src="cid:codeID" alt="QR code">`,
    attachments: [
      {
        filename: 'codeID.png',
        content: qrBuffer,
        content_id: 'codeID',
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function sendWithGmail({ to, eventName, qrBuffer }) {
  if (!gmailTransporter) {
    throw new Error('Gmail is not configured on the server');
  }

  const from = process.env.userEm?.trim();

  await gmailTransporter.sendMail({
    from,
    to,
    subject: `Confirmation Email for ${eventName}`,
    html: `<p>Here's your QR Code to be scanned in</p>
      <img src="cid:codeID" alt="QR code">`,
    attachments: [
      {
        filename: 'codeID.png',
        content: qrBuffer,
        cid: 'codeID',
      },
    ],
  });
}

async function sendRegistrationEmail({ to, eventName, qrBuffer }) {
  const provider = getEmailProvider();

  if (provider === 'resend') {
    return sendWithResend({ to, eventName, qrBuffer });
  }

  if (provider === 'gmail') {
    return sendWithGmail({ to, eventName, qrBuffer });
  }

  throw new Error('Email is not configured on the server');
}

async function verifyEmailConfig() {
  const provider = getEmailProvider();

  if (!provider) {
    return { ok: false, message: 'Email credentials not configured', provider: null };
  }

  if (provider === 'resend') {
    return {
      ok: true,
      message: 'Resend API configured (uses HTTPS, works on Render)',
      provider: 'resend',
    };
  }

  try {
    await gmailTransporter.verify();
    return { ok: true, message: 'Gmail SMTP ready (local dev only)', provider: 'gmail' };
  } catch (error) {
    console.error('Email verification failed:', error.message);
    return {
      ok: false,
      message: `${error.message}. On Render, use RESEND_API_KEY instead of Gmail SMTP.`,
      provider: 'gmail',
    };
  }
}

module.exports = {
  sendRegistrationEmail,
  verifyEmailConfig,
  getEmailProvider,
};