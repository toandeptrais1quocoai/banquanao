import { formatPrice } from '../utils/format';

export default function PaymentQr({
  amount,
  qrImageUrl,
  accountNo,
  accountName,
  bankName,
  transferCode,
  compact = false,
}) {
  if (!qrImageUrl) {
    return (
      <p className="status">
        Chưa cấu hình tài khoản nhận QR. Điền VIETQR_BANK / VIETQR_ACCOUNT_NO trong backend/.env.
      </p>
    );
  }

  return (
    <div className={`payment-qr${compact ? ' payment-qr-compact' : ''}`}>
      <img src={qrImageUrl} alt={`QR chuyển khoản ${formatPrice(amount)}`} />
      <div className="payment-qr-meta">
        <p className="payment-qr-amount">{formatPrice(amount)}</p>
        {bankName ? <p>{bankName}</p> : null}
        {accountNo ? (
          <p>
            STK <strong>{accountNo}</strong>
            {accountName ? ` · ${accountName}` : ''}
          </p>
        ) : null}
        {transferCode ? (
          <p>
            Nội dung CK: <strong>{transferCode}</strong>
          </p>
        ) : (
          <p className="muted">Quét QR — đúng số tiền đơn hàng.</p>
        )}
      </div>
    </div>
  );
}
