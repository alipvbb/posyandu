import nodemailer from 'nodemailer';
import { APP_NAME } from '../config/app-meta.js';
import { env } from '../config/env.js';

let transporter;

const canUseSmtp = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
};

export const sendRegisterVerificationEmail = async ({ to, name, code, villageName }) => {
  const subject = `Kode Verifikasi ${APP_NAME}`;
  const text = [
    `Halo ${name},`,
    '',
    `Terima kasih telah mendaftar ${APP_NAME}.`,
    `Desa: ${villageName}`,
    '',
    `Kode verifikasi Anda: ${code}`,
    '',
    'Kode berlaku 15 menit.',
    'Jika Anda tidak merasa mendaftar, abaikan email ini.',
  ].join('\n');

  if (!canUseSmtp()) {
    console.warn(`[MAIL MOCK] to=${to} subject="${subject}" code=${code}`);
    return { sent: false, mocked: true };
  }

  await getTransporter().sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
  });

  return { sent: true, mocked: false };
};
