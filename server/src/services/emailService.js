const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:9000';

async function sendInvite({ to, firstName, token }) {
  const link = `${CLIENT_URL}/#/set-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: 'Pozivnica za veleri.XP',
    html: `
      <div style="font-family: Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; color: #111827;">
        <p style="font-size: 1rem;">Pozdrav, <strong>${firstName}</strong>,</p>
        <p>Pozvan/a ste u sustav <strong>veleri.XP</strong> — aplikaciju za upravljanje zahtjevima za nabavu.</p>
        <p>Kliknite na gumb ispod kako biste postavili svoju lozinku i aktivirali račun:</p>
        <p style="margin: 32px 0;">
          <a href="${link}"
             style="background: #0067b8; color: #fff; padding: 12px 28px; text-decoration: none; font-weight: 600; font-size: 0.9375rem;">
            Postavi lozinku
          </a>
        </p>
        <p style="color: #6b7280; font-size: 0.8125rem;">
          Link je valjan 48 sati. Ako niste očekivali ovu poruku, možete je ignorirati.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 0.75rem;">veleri.XP · Veleučilište u Rijeci</p>
      </div>
    `,
  });
}

module.exports = { sendInvite };
