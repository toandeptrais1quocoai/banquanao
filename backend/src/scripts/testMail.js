import '../config/env.js';
import { getMailStatus, sendPasswordOtp } from '../services/mailService.js';

const to = process.argv[2] || process.env.GMAIL_USER;
const status = getMailStatus();

if (!status.configured) {
  console.error(status.hint);
  process.exit(1);
}

if (!to) {
  console.error('Dùng: node src/scripts/testMail.js ban@gmail.com');
  process.exit(1);
}

const code = String(Math.floor(100000 + Math.random() * 900000));
await sendPasswordOtp({ to, code, fullName: 'Kiểm tra OTP' });
console.log(`Đã gửi OTP thử ${code} tới ${to}`);
