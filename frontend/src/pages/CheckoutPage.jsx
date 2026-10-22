import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { checkout } from '../api/client';
import { TextField } from '../components/Field';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading, removeItem, refresh } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

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
  }, [user, fullName]);

  if (loading) {
    return <p className="status">Đang lấy giỏ hàng…</p>;
  }

  if (!cart.items.length && !pending) {
    return <Navigate to="/gio-hang" replace />;
  }

  if (!checkoutItems.length && !pending) {
    return <Navigate to="/gio-hang" replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    const name = fullName.trim().replace(/\s+/g, ' ');
    if (name.length < 2) next.fullName = 'Họ tên cần ít nhất 2 ký tự.';
    if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.trim())) next.phone = 'Số điện thoại chưa đúng.';
    if (address.trim().length < 8) next.address = 'Địa chỉ cần ít nhất 8 ký tự.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setFormError('');
    try {
      const payload = {
        fullName: name,
        phone: phone.trim(),
        address: address.trim(),
        note: note.trim(),
        paymentMethod: 'COD',
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
        state: { order: data.order, autoPrint: true },
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
      setPending(false);
    }
  }

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
        <form className="checkout-form" onSubmit={onSubmit} noValidate>
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
              <input type="radio" name="pay" checked readOnly />
              <span>
                <strong>COD — thanh toán khi nhận hàng</strong>
                <small>Shipper thu tiền mặt khi giao.</small>
              </span>
            </label>
          </fieldset>

          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            {pending ? 'Đang đặt…' : `Đặt hàng · ${formatPrice(checkoutTotal)}`}
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
    </section>
  );
}
