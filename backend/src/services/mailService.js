import nodemailer from 'nodemailer';
import { AppError } from '../utils/errors.js';

function gmailUser() {
  return String(process.env.GMAIL_USER || '').trim();
}

function gmailAppPassword() {
  // Google hiện App Password dạng "xxxx xxxx xxxx xxxx" — bỏ khoảng trắng khi gửi.
  return String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
}

function mailConfigured() {
  const user = gmailUser();
  const pass = gmailAppPassword();
  return Boolean(user && pass && user.includes('@'));
}

function createTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: gmailUser(),
      pass: gmailAppPassword(),
    },
  });
}

export function isMailConfigured() {
  return mailConfigured();
}

export function getMailStatus() {
  return {
    configured: mailConfigured(),
    from: mailConfigured() ? gmailUser() : null,
    hint: mailConfigured()
      ? null
      : 'Thêm GMAIL_USER và GMAIL_APP_PASSWORD (mật khẩu ứng dụng 16 ký tự) vào backend/.env rồi chạy lại API.',
  };
}

export async function sendPasswordOtp({ to, code, fullName }) {
  if (!mailConfigured()) {
    throw new AppError(
      503,
      'Chưa cấu hình Gmail. Mở backend/.env, điền GMAIL_USER và GMAIL_APP_PASSWORD (Google → Bảo mật → Xác minh 2 bước → Mật khẩu ứng dụng).',
    );
  }

  const shopMail = gmailUser();
  const fromName = process.env.MAIL_FROM_NAME || 'NT shop';
  const from = `"${fromName}" <${shopMail}>`;
  const greeting = fullName ? `Xin chào ${fullName},` : 'Xin chào,';
  const recipient = String(to || '').trim().toLowerCase();

  try {
    const transport = createTransport();
    const info = await transport.sendMail({
      from,
      // Chỉ gửi tới email người dùng nhập (bạn bè), không gửi về Gmail shop
      to: recipient,
      replyTo: shopMail,
      // Không đưa OTP vào tiêu đề — dễ bị Gmail đẩy vào Spam
      subject: 'Mã xác nhận đặt lại mật khẩu — NT shop',
      text: [
        greeting,
        '',
        'Bạn vừa yêu cầu đặt lại mật khẩu tại NT shop.',
        `Mã OTP của bạn là: ${code}`,
        'Mã có hiệu lực trong 15 phút.',
        '',
        'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
        '',
        'NT shop',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#0f172a;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#0b2f6b;font-weight:700">NT shop</p>
          <p>${greeting}</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu tại <strong>NT shop</strong>.</p>
          <p>Dùng mã OTP bên dưới:</p>
          <p style="font-size:32px;letter-spacing:.28em;font-weight:800;margin:28px 0;color:#0b2f6b;background:#eef4ff;padding:16px 18px;border-radius:10px;text-align:center">${code}</p>
          <p>Mã có hiệu lực trong <strong>15 phút</strong>.</p>
          <p style="color:#64748b;font-size:13px;margin-bottom:0">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>
      `,
    });

    console.log(`OTP đã gửi tới ${recipient} messageId=${info.messageId || 'n/a'}`);
    return {
      messageId: info.messageId || null,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    };
  } catch (error) {
    console.error('Gửi OTP Gmail thất bại:', error.message);
    throw new AppError(
      502,
      'Không gửi được email OTP. Kiểm tra Gmail đã bật xác minh 2 bước, App Password đúng, và mạng ổn định.',
    );
  }
}
