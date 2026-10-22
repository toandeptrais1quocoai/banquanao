import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function CartPage() {
  const { user } = useAuth();
  const { cart, loading, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    document.title = 'Giỏ hàng — NT shop';
  }, []);

  useEffect(() => {
    setSelected(new Set(cart.items.map((item) => String(item.id))));
  }, [cart.items]);

  const selectedItems = useMemo(
    () => cart.items.filter((item) => selected.has(String(item.id))),
    [cart.items, selected],
  );
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const allSelected = cart.items.length > 0 && selected.size === cart.items.length;

  function toggleOne(id) {
    const key = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(cart.items.map((item) => String(item.id))));
  }

  async function changeQty(item, next) {
    if (next < 1 || next > 20) return;
    setBusyId(item.id);
    setError('');
    try {
      await setQuantity(item.id, next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function onRemove(item) {
    setBusyId(item.id);
    setError('');
    try {
      await removeItem(item.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function onClear() {
    setBusyId('clear');
    setError('');
    try {
      await clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  function goCheckout() {
    if (!selectedItems.length) {
      setError('Bạn tích chọn ít nhất một món để thanh toán.');
      return;
    }
    navigate('/thanh-toan', {
      state: { selectedIds: selectedItems.map((item) => item.id) },
    });
  }

  if (loading) {
    return <p className="status">Đang mở giỏ hàng…</p>;
  }

  if (!cart.items.length) {
    return (
      <div className="empty-page">
        <p className="kicker">Giỏ hàng</p>
        <h1>Giỏ đang trống</h1>
        <p>Vào trang sản phẩm, chọn màu + size rồi thêm vào giỏ.</p>
        <Link className="btn btn-primary" to="/">Về gian hàng</Link>
      </div>
    );
  }

  return (
    <section className="cart-page">
      <div className="section-head">
        <div>
          <p className="kicker">Giỏ hàng</p>
          <h2>{cart.itemCount} món đang giữ</h2>
        </div>
        <button
          type="button"
          className="btn btn-line btn-small"
          onClick={onClear}
          disabled={busyId === 'clear'}
        >
          Xóa hết
        </button>
      </div>

      {error ? <p className="alert" role="alert">{error}</p> : null}

      <div className="cart-layout">
        <div>
          <label className="cart-select-all">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>Chọn tất cả ({selectedItems.length}/{cart.items.length})</span>
          </label>
          <ul className="cart-list">
            {cart.items.map((item) => {
              const checked = selected.has(String(item.id));
              return (
                <li key={item.id} className={`cart-row${checked ? '' : ' is-unchecked'}`}>
                  <label className="cart-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(item.id)}
                      aria-label={`Chọn ${item.name}`}
                    />
                  </label>
                  <Link to={`/san-pham/${item.slug}`} className="cart-thumb">
                    <img src={item.imageUrl} alt={item.name} />
                  </Link>
                  <div className="cart-meta">
                    <Link to={`/san-pham/${item.slug}`}>
                      <h3>{item.name}</h3>
                    </Link>
                    <p>
                      <span className="swatch-line">
                        <i className="swatch" style={{ background: item.colorHex }} />
                        <span>{item.colorName}</span>
                      </span>
                      <span className="dot">·</span>
                      <span>Size {item.size}</span>
                    </p>
                    <p className="cart-unit">{formatPrice(item.price)}</p>
                    <div className="cart-actions">
                      <div className="qty">
                        <button
                          type="button"
                          aria-label="Giảm"
                          disabled={busyId === item.id || item.quantity <= 1}
                          onClick={() => changeQty(item, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Tăng"
                          disabled={busyId === item.id || item.quantity >= 20}
                          onClick={() => changeQty(item, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-remove"
                        disabled={busyId === item.id}
                        onClick={() => onRemove(item)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </div>
                  <p className="cart-line">{formatPrice(item.lineTotal)}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="cart-summary">
          <p className="kicker">Tạm tính món đã chọn</p>
          <div className="summary-row">
            <span>{selectedCount} món</span>
            <strong>{formatPrice(selectedTotal)}</strong>
          </div>
          <p className="summary-note">
            {user
              ? 'Tích chọn món muốn mua rồi thanh toán. Món chưa chọn vẫn giữ trong giỏ.'
              : 'Tích chọn món muốn mua. Bạn chưa đăng nhập vẫn thanh toán được.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={goCheckout}
            disabled={!selectedItems.length}
          >
            Thanh toán ({selectedItems.length})
          </button>
          <button
            type="button"
            className="btn btn-line btn-block"
            onClick={onClear}
            disabled={busyId === 'clear'}
          >
            Xóa toàn bộ giỏ
          </button>
          <Link className="btn btn-line btn-block" to="/">Tiếp tục xem đồ</Link>
        </aside>
      </div>
    </section>
  );
}
