import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getOrder } from '../api/client';
import Invoice from '../components/Invoice';
import PaymentQr from '../components/PaymentQr';
import { useVisibilityPoll } from '../hooks/useVisibilityPoll';
import { formatPrice } from '../utils/format';
import { formatOrderStatus } from '../utils/orderStatus';

const TERMINAL = new Set(['done', 'cancelled']);

function paymentLead(order) {
  if (order.paymentMethod === 'QR') {
    return `Tổng ${formatPrice(order.total)}. Quét QR bên dưới để chuyển đúng số tiền (nội dung NT${order.id}).`;
  }
  return `Tổng ${formatPrice(order.total)}. Thanh toán khi nhận hàng (COD). NT shop sẽ liên hệ qua số điện thoại bạn vừa để.`;
}

export default function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();
  const seeded = location.state?.order || null;
  const needsFetch = !seeded || !Array.isArray(seeded.items);
  const [order, setOrder] = useState(seeded);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(needsFetch);

  const fetchOrder = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const data = await getOrder(id);
        setOrder(data.order);
        setError('');
      } catch (err) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    document.title = `Đơn #${id} — NT shop`;
  }, [id]);

  useEffect(() => {
    if (needsFetch) fetchOrder();
  }, [needsFetch, fetchOrder]);

  const shouldPoll = Boolean(order) && !TERMINAL.has(order.status);

  useVisibilityPoll(() => fetchOrder({ silent: true }), {
    intervalMs: 12000,
    enabled: shouldPoll,
  });

  if (loading) return <p className="status">Đang lấy đơn…</p>;
  if (error || !order) {
    return (
      <div className="empty-page">
        <h1>Không thấy đơn này</h1>
        <p>{error || 'Đơn có thể chưa được tạo.'}</p>
        <Link className="btn btn-primary" to="/">
          Về gian hàng
        </Link>
      </div>
    );
  }

  const isQr = order.paymentMethod === 'QR';

  return (
    <section className="order-ok">
      <div className="order-ok-screen">
        <p className="kicker">Đặt hàng xong</p>
        <h1>Đơn #{order.id} đã đặt thành công</h1>
        <p className="order-status-line">
          Trạng thái:{' '}
          <em className={`order-status order-status-${order.status}`}>
            {formatOrderStatus(order.status)}
          </em>
        </p>
        <p className="lead">{paymentLead(order)}</p>

        {isQr ? (
          <PaymentQr
            amount={order.total}
            qrImageUrl={order.qrImageUrl || order.payment?.qrImageUrl}
            accountNo={order.payment?.accountNo}
            accountName={order.payment?.accountName}
            bankName={order.payment?.bankName}
            transferCode={order.transferCode || `NT${order.id}`}
          />
        ) : null}

        <div className="buy-row">
          <Link className="btn btn-primary" to="/don-hang">
            Theo dõi đơn
          </Link>
          <Link className="btn btn-line" to="/">
            Tiếp tục mua
          </Link>
        </div>
      </div>

      <Invoice order={order} />
    </section>
  );
}
