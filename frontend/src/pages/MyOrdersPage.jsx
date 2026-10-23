import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { cancelOrder, myOrders } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useVisibilityPoll } from '../hooks/useVisibilityPoll';
import { formatDateTime, formatPrice } from '../utils/format';
import { canCustomerCancel, formatOrderStatus } from '../utils/orderStatus';

export default function MyOrdersPage() {
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await myOrders();
      setOrders(data.orders || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Trạng thái đơn hàng — NT shop';
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    load();
  }, [ready, user, load]);

  useVisibilityPoll(() => load({ silent: true }), {
    intervalMs: 12000,
    enabled: Boolean(ready && user),
  });

  async function onCancel(order) {
    if (!canCustomerCancel(order.status)) return;
    const ok = window.confirm(`Hủy đơn #${order.id}?`);
    if (!ok) return;
    setBusyId(order.id);
    setError('');
    try {
      const data = await cancelOrder(order.id);
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, ...data.order } : item)),
      );
    } catch (err) {
      setError(err.message);
      await load({ silent: true });
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) return <p className="status">Đang kiểm tra phiên…</p>;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: '/don-hang' }} />;

  return (
    <section className="account-page">
      <div className="section-head">
        <div>
          <p className="kicker">Tài khoản</p>
          <h2>Trạng thái đơn hàng</h2>
        </div>
        <button className="text-btn" type="button" onClick={() => load()}>
          Làm mới
        </button>
      </div>

      {error ? <p className="alert" role="alert">{error}</p> : null}
      {loading ? <p className="status">Đang tải đơn…</p> : null}

      {!loading && !orders.length ? (
        <div className="empty-page">
          <h1>Chưa có đơn nào</h1>
          <p>Khi bạn đặt hàng, trạng thái sẽ hiện ở đây và cập nhật theo shop.</p>
          <Link className="btn btn-primary" to="/">
            Mua sắm
          </Link>
        </div>
      ) : null}

      {orders.length ? (
        <ul className="order-track-list">
          {orders.map((order) => {
            const canCancel = canCustomerCancel(order.status);
            const cancelled = order.status === 'cancelled';
            return (
              <li key={order.id} className="order-track-card">
                <div className="order-track-top">
                  <div>
                    <strong>Đơn #{order.id}</strong>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <em className={`order-status order-status-${order.status}`}>
                    {formatOrderStatus(order.status)}
                  </em>
                </div>
                <p>
                  {order.paymentMethod === 'QR' ? 'Chuyển khoản QR' : 'COD'} ·{' '}
                  {formatPrice(order.total)}
                  {order.discountAmount > 0
                    ? ` · đã giảm ${formatPrice(order.discountAmount)}${order.voucherCode ? ` (${order.voucherCode})` : ''}`
                    : ''}
                </p>
                <p className="muted">{order.address}</p>
                <div className="order-track-actions">
                  <Link className="text-btn" to={`/dat-hang/${order.id}`}>
                    Xem hóa đơn
                  </Link>
                  {!cancelled ? (
                    <button
                      type="button"
                      className="btn btn-line btn-small order-cancel-btn"
                      disabled={!canCancel || busyId === order.id}
                      title={
                        canCancel
                          ? 'Hủy đơn này'
                          : 'Shop đã xác nhận — không hủy được nữa'
                      }
                      onClick={() => onCancel(order)}
                    >
                      {busyId === order.id
                        ? 'Đang hủy…'
                        : canCancel
                          ? 'Hủy đơn'
                          : 'Không hủy được'}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
