import { getPaymentInfo, buildVietQrUrl } from '../config/payment.js';

export function getPayment(req, res) {
  const payment = getPaymentInfo();
  const amount = Number(req.query.amount);
  const addInfo = typeof req.query.addInfo === 'string' ? req.query.addInfo : '';
  const qrImageUrl =
    payment.enabled && Number.isFinite(amount) && amount > 0
      ? buildVietQrUrl({ amount, addInfo: addInfo || undefined })
      : null;
  res.json({ payment: { ...payment, qrImageUrl } });
}
