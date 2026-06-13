import nodemailer from 'nodemailer';
import config from './environment.js';
import logger from './logger.js';

let transporter = null;

export const initializeEmail = async () => {
  if (transporter) return transporter;

  if (!config.email.smtpHost || !config.email.smtpUser) {
    logger.warn('SMTP not configured, emails will be logged only');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort || 587,
      secure: (config.email.smtpPort || 587) === 465,
      auth: {
        user: config.email.smtpUser,
        pass: config.email.smtpPassword,
      },
    });

    await transporter.verify();
    logger.info('Email transport ready');
  } catch (error) {
    logger.warn('Email transport failed to initialize:', error.message);
    transporter = null;
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    logger.info('Email not sent (no transport):', { to, subject });
    return { messageId: 'no-transport' };
  }

  try {
    const info = await transporter.sendMail({
      from: config.email.smtpUser ? `"PaceUp" <${config.email.smtpUser}>` : 'noreply@paceup.com',
      to,
      subject,
      text,
      html,
    });
    logger.info('Email sent:', { to, subject, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Failed to send email:', { to, subject, error: error.message });
    throw error;
  }
};

export const sendVerificationEmail = async (email, token) => {
  const url = `${config.apiBaseUrl}/api/${config.apiVersion}/auth/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Verifica tu correo electrónico - PaceUp',
    text: `Bienvenido a PaceUp! Por favor verifica tu correo haciendo clic en: ${url}`,
    html: `<h2>Bienvenido a PaceUp!</h2><p>Por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:</p><p><a href="${url}">Verificar correo</a></p><p>Este enlace expira en 24 horas.</p>`,
  });
};

export const sendPasswordResetEmail = async (email, token) => {
  const url = `${config.apiBaseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: 'Restablece tu contraseña - PaceUp',
    text: `Has solicitado restablecer tu contraseña. Haz clic en: ${url}`,
    html: `<h2>Restablecer contraseña</h2><p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href="${url}">Restablecer contraseña</a></p><p>Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.</p>`,
  });
};

export default { initializeEmail, sendEmail, sendVerificationEmail, sendPasswordResetEmail };
