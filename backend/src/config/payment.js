import './env.js';

const BANK_LABELS = {
  VCB: 'Vietcombank',
  TCB: 'Techcombank',
  MB: 'MB Bank',
  ACB: 'ACB',
  VPB: 'VPBank',
  TPB: 'TPBank',
  BIDV: 'BIDV',
  VIB: 'VIB',
  STB: 'Sacombank',
  AGB: 'Agribank',
  MSB: 'MSB',
  OCB: 'OCB',
  SHB: 'SHB',
  HDB: 'HDBank',
  LPB: 'LienVietPostBank',
};

export function getPaymentInfo() {
  const bank = String(process.env.VIETQR_BANK || '').trim().toUpperCase();
  const accountNo = String(process.env.VIETQR_ACCOUNT_NO || '').replace(/\s+/g, '');
  const accountName = String(process.env.VIETQR_ACCOUNT_NAME || 'NT SHOP').trim();
  const enabled = Boolean(bank && accountNo);
  return {
    enabled,
    bank,
    bankName: BANK_LABELS[bank] || bank || '',
    accountNo,
    accountName,
  };
}

export function buildVietQrUrl({ amount, addInfo } = {}) {
  const info = getPaymentInfo();
  if (!info.enabled) return null;
  const template = 'compact2';
  const base = `https://img.vietqr.io/image/${encodeURIComponent(info.bank)}-${encodeURIComponent(info.accountNo)}-${template}.png`;
  const params = new URLSearchParams();
  const money = Math.round(Number(amount) || 0);
  if (money > 0) params.set('amount', String(money));
  if (addInfo) params.set('addInfo', String(addInfo).slice(0, 25));
  if (info.accountName) params.set('accountName', info.accountName);
  return `${base}?${params.toString()}`;
}
