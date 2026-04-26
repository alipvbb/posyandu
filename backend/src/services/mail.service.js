import { existsSync } from 'node:fs';
import nodemailer from 'nodemailer';
import { APP_NAME } from '../config/app-meta.js';
import { env } from '../config/env.js';

let transporter;

const canUseSmtp = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);
const canUseSendmail = () => existsSync('/usr/sbin/sendmail');

const getTransporter = () => {
  if (transporter) return transporter;

  if (canUseSmtp()) {
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
  }

  if (canUseSendmail()) {
    transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail',
    });
    return transporter;
  }

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

  const transport = getTransporter();
  if (!transport) {
    console.warn(`[MAIL MOCK] to=${to} subject="${subject}" code=${code}`);
    return { sent: false, mocked: true };
  }
  try {
    await transport.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
    });

    return { sent: true, mocked: false, channel: canUseSmtp() ? 'smtp' : 'sendmail' };
  } catch (error) {
    console.error('[MAIL ERROR] gagal kirim email verifikasi, fallback ke mock', error);
    console.warn(`[MAIL MOCK] to=${to} subject="${subject}" code=${code}`);
    return { sent: false, mocked: true, channel: 'mock-fallback' };
  }
};

export const sendPasswordResetEmail = async ({ to, name, code, villageName }) => {
  const subject = `Kode Reset Password ${APP_NAME}`;
  const text = [
    `Halo ${name},`,
    '',
    `Kami menerima permintaan reset password untuk akun ${APP_NAME}.`,
    `Desa: ${villageName}`,
    '',
    `Kode reset password Anda: ${code}`,
    '',
    'Kode berlaku 15 menit.',
    'Jika Anda tidak merasa meminta reset password, abaikan email ini.',
  ].join('\n');

  const transport = getTransporter();
  if (!transport) {
    console.warn(`[MAIL MOCK] to=${to} subject="${subject}" code=${code}`);
    return { sent: false, mocked: true };
  }
  try {
    await transport.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
    });

    return { sent: true, mocked: false, channel: canUseSmtp() ? 'smtp' : 'sendmail' };
  } catch (error) {
    console.error('[MAIL ERROR] gagal kirim email reset password, fallback ke mock', error);
    console.warn(`[MAIL MOCK] to=${to} subject="${subject}" code=${code}`);
    return { sent: false, mocked: true, channel: 'mock-fallback' };
  }
};
