import nodemailer from 'nodemailer';
import { AppError } from '../utils/errors.js';

function mailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export function isMailConfigured() {
  return mailConfigured();
}

export async function sendPasswordOtp({ to, code, fullName }) {
  if (!mailConfigured()) {
    throw new AppError(
      503,
      'Chưa cấu hình Gmail. Thêm GMAIL_USER và GMAIL_APP_PASSWORD vào file backend/.env.',
    );
  }

  const fromName = process.env.MAIL_FROM_NAME || 'NT shop';
  const from = `"${fromName}" <${process.env.GMAIL_USER}>`;
  const greeting = fullName ? `Xin chào ${fullName},` : 'Xin chào,';

  try {
    const transport = createTransport();
    await transport.sendMail({
      from,
      to,
      subject: 'Mã OTP đặt lại mật khẩu — NT shop',
      text: [
        greeting,
        '',
        `Mã OTP của bạn là: ${code}`,
        'Mã có hiệu lực trong 15 phút.',
        '',
        'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
        '',
        'NT shop',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a1c1a;max-width:480px">
          <p>${greeting}</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu tại <strong>NT shop</strong>.</p>
          <p style="font-size:28px;letter-spacing:0.2em;font-weight:700;margin:24px 0">${code}</p>
          <p>Mã OTP có hiệu lực trong <strong>15 phút</strong>.</p>
          <p style="color:#666;font-size:13px">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Gửi OTP Gmail thất bại:', error.message);
    throw new AppError(
      502,
      'Không gửi được email OTP. Kiểm tra Gmail App Password và kết nối mạng.',
    );
  }
}
