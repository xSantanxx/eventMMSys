const nodemailer = require('nodemailer');

function getMailCredentials() {
  const user = process.env.userEm?.trim();
  // Gmail app passwords are shown with spaces but must be used without them
  const pass = process.env.userPass?.replace(/\s/g, '');

  return { user, pass };
}

function createTransporter() {
  const { user, pass } = getMailCredentials();

  if (!user || !pass) {
    console.warn('Email credentials missing: set userEm and userPass environment variables');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

const transporter = createTransporter();

async function sendRegistrationEmail({ to, eventName, qrBuffer }) {
  if (!transporter) {
    throw new Error('Email is not configured on the server');
  }

  const from = process.env.userEm?.trim();

  await transporter.sendMail({
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

async function verifyEmailConfig() {
  if (!transporter) {
    return { ok: false, message: 'Email credentials not configured' };
  }

  try {
    await transporter.verify();
    return { ok: true, message: 'Email transport ready' };
  } catch (error) {
    console.error('Email verification failed:', error.message);
    return { ok: false, message: error.message };
  }
}

module.exports = {
  sendRegistrationEmail,
  verifyEmailConfig,
};