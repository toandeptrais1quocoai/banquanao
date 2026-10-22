import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { checkout, getPayment } from '../api/client';
import { TextField } from '../components/Field';
import PaymentQr from '../components/PaymentQr';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading, removeItem, refresh } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const selectedIds = useMemo(() => {
    const raw = location.state?.selectedIds;
    if (!Array.isArray(raw) || !raw.length) return null;
    return new Set(raw.map(String));
  }, [location.state]);

  const checkoutItems = useMemo(() => {
    if (!selectedIds) return cart.items;
    return cart.items.filter((item) => selectedIds.has(String(item.id)));
  }, [cart.items, selectedIds]);

  const checkoutCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutTotal = checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0);

  useEffect(() => {
    document.title = 'Thanh toán — NT shop';
  }, []);

  useEffect(() => {
    if (user?.fullName && !fullName) {
      setFullName(user.fullName);
    }
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user, fullName, phone]);

  useEffect(() => {
    let ignore = false;
    getPayment(checkoutTotal || undefined)
      .then((data) => {
        if (!ignore) setPaymentInfo(data.payment);
      })
      .catch(() => {
        if (!ignore) setPaymentInfo({ enabled: false });
      });
    return () => {
      ignore = true;
    };
  }, [checkoutTotal]);

  if (loading) {
    return <p className="status">Đang lấy giỏ hàng…</p>;
  }

  if (!cart.items.length && !pending) {
    return <Navigate to="/gio-hang" replace />;
  }

  if (!checkoutItems.length && !pending) {
    return <Navigate to="/gio-hang" replace />;
  }

  function validate() {
    const next = {};
    const name = fullName.trim().replace(/\s+/g, ' ');
    if (name.length < 2) next.fullName = 'Họ tên cần ít nhất 2 ký tự.';
    if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.trim())) next.phone = 'Số điện thoại chưa đúng.';
    if (address.trim().length < 8) next.address = 'Địa chỉ cần ít nhất 8 ký tự.';
    if (paymentMethod === 'QR' && !paymentInfo?.enabled) {
      next.payment = 'Shop chưa cấu hình tài khoản nhận QR.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onReview(event) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    setConfirming(true);
  }

  async function placeOrder() {
    if (!validate()) {
      setConfirming(false);
      return;
    }

    setPending(true);
    setFormError('');
    try {
      const name = fullName.trim().replace(/\s+/g, ' ');
      const payload = {
        fullName: name,
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
        paymentMethod,
      };
      if (user) {
        payload.itemIds = checkoutItems.map((item) => item.id);
      } else {
        payload.items = checkoutItems.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color || item.colorName,
          quantity: item.quantity,
        }));
      }
      const data = await checkout(payload);
      navigate(`/dat-hang/${data.order.id}`, {
        replace: true,
        state: { order: data.order },
      });

      if (user) {
        await refresh().catch(() => {});
      } else {
        for (const item of checkoutItems) {
          await removeItem(item.id);
        }
      }
    } catch (err) {
      setFormError(err.message);
      setConfirming(false);
      setPending(false);
    }
  }

  const payLabel = paymentMethod === 'QR' ? 'Chuyển khoản QR' : 'COD — thanh toán khi nhận hàng';

  return (
    <section className="checkout-page">
      <div className="section-head">
        <div>
          <p className="kicker">Thanh toán</p>
          <h2>Giao hàng & nhận tiền</h2>
        </div>
        <Link className="text-btn" to="/gio-hang">Về giỏ hàng</Link>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={onReview} noValidate>
          {formError ? <p className="alert" role="alert">{formError}</p> : null}
          <TextField
            label="Họ và tên"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={errors.fullName}
          />
          <TextField
            label="Số điện thoại"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors.phone}
          />
          <label className="field">
            <span>Địa chỉ nhận hàng</span>
            <textarea
              rows={3}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            {errors.address ? <small>{errors.address}</small> : null}
          </label>
          <label className="field">
            <span>Ghi chú (không bắt buộc)</span>
            <textarea
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: giao giờ hành chính"
            />
          </label>

          <fieldset className="pay-box">
            <legend>Hình thức thanh toán</legend>
            <label className="pay-option">
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              <span>
                <strong>COD — thanh toán khi nhận hàng</strong>
                <small>Shipper thu tiền mặt khi giao.</small>
              </span>
            </label>
            <label className="pay-option">
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === 'QR'}
                onChange={() => setPaymentMethod('QR')}
                disabled={paymentInfo && !paymentInfo.enabled}
              />
              <span>
                <strong>Quét mã QR — chuyển khoản</strong>
                <small>
                  {paymentInfo?.enabled
                    ? `VietQR đúng ${formatPrice(checkoutTotal)}.`
                    : 'Chưa cấu hình STK nhận tiền (backend/.env).'}
                </small>
              </span>
            </label>
            {errors.payment ? <small className="field-error">{errors.payment}</small> : null}

            {paymentMethod === 'QR' && paymentInfo?.enabled ? (
              <PaymentQr
                compact
                amount={checkoutTotal}
                qrImageUrl={paymentInfo.qrImageUrl}
                accountNo={paymentInfo.accountNo}
                accountName={paymentInfo.accountName}
                bankName={paymentInfo.bankName}
              />
            ) : null}
          </fieldset>

          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            Đặt hàng · {formatPrice(checkoutTotal)}
          </button>
        </form>

        <aside className="cart-summary">
          <p className="kicker">Đơn của bạn</p>
          <ul className="checkout-items">
            {checkoutItems.map((item) => (
              <li key={item.id}>
                <img src={item.imageUrl} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.color || item.colorName} · Size {item.size} · x{item.quantity}
                  </span>
                </div>
                <em>{formatPrice(item.lineTotal)}</em>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>{checkoutCount} món</span>
            <strong>{formatPrice(checkoutTotal)}</strong>
          </div>
        </aside>
      </div>

      {confirming ? (
        <div className="checkout-confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="checkout-confirm-card">
            <p className="kicker">Xác nhận</p>
            <h2 id="confirm-title">Kiểm tra thông tin trước khi đặt</h2>
            <dl className="checkout-confirm-meta">
              <div>
                <dt>Người nhận</dt>
                <dd>{fullName.trim().replace(/\s+/g, ' ')}</dd>
              </div>
              <div>
                <dt>Điện thoại</dt>
                <dd>{phone.trim()}</dd>
              </div>
              <div>
                <dt>Địa chỉ</dt>
                <dd>{address.trim()}</dd>
              </div>
              {note.trim() ? (
                <div>
                  <dt>Ghi chú</dt>
                  <dd>{note.trim()}</dd>
                </div>
              ) : null}
              <div>
                <dt>Thanh toán</dt>
                <dd>{payLabel}</dd>
              </div>
            </dl>
            <ul className="checkout-items">
              {checkoutItems.map((item) => (
                <li key={`confirm-${item.id}`}>
                  <img src={item.imageUrl} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.color || item.colorName} · Size {item.size} · x{item.quantity}
                    </span>
                  </div>
                  <em>{formatPrice(item.lineTotal)}</em>
                </li>
              ))}
            </ul>
            <div className="summary-row">
              <span>{checkoutCount} món</span>
              <strong>{formatPrice(checkoutTotal)}</strong>
            </div>
            <div className="buy-row">
              <button
                className="btn btn-line"
                type="button"
                disabled={pending}
                onClick={() => setConfirming(false)}
              >
                Sửa lại
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={pending}
                onClick={placeOrder}
              >
                {pending ? 'Đang đặt…' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
