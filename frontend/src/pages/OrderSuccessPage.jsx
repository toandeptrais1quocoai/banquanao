import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getOrder } from '../api/client';
import Invoice from '../components/Invoice';
import { formatPrice } from '../utils/format';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();
  const seeded = location.state?.order || null;
  const autoPrint = Boolean(location.state?.autoPrint);
  const needsFetch = !seeded || !Array.isArray(seeded.items);
  const [order, setOrder] = useState(seeded);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(needsFetch);

  useEffect(() => {
    document.title = `Đơn #${id} — NT shop`;
  }, [id]);

  useEffect(() => {
    if (!needsFetch) return undefined;
    let ignore = false;
    setLoading(true);
    getOrder(id)
      .then((data) => {
        if (!ignore) setOrder(data.order);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, needsFetch]);

  useEffect(() => {
    if (!autoPrint || loading || !order) return undefined;
    const timer = window.setTimeout(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoPrint, loading, order]);

  function printInvoice() {
    window.print();
  }

  if (loading) return <p className="status">Đang lấy đơn…</p>;
  if (error || !order) {
    return (
      <div className="empty-page">
        <h1>Không thấy đơn này</h1>
        <p>{error || 'Đơn có thể chưa được tạo.'}</p>
        <Link className="btn btn-primary" to="/">Về gian hàng</Link>
      </div>
    );
  }

  return (
    <section className="order-ok">
      <div className="order-ok-screen">
        <p className="kicker">Đặt hàng xong</p>
        <h1>Đơn #{order.id} đã ghi nhận</h1>
        <p className="lead">
          Tổng {formatPrice(order.total)}. Thanh toán khi nhận hàng (COD).
          NT shop sẽ liên hệ qua số điện thoại bạn vừa để.
        </p>
        <div className="buy-row">
          <button className="btn btn-primary" type="button" onClick={printInvoice}>
            In lại hóa đơn
          </button>
          <Link className="btn btn-line" to="/">Tiếp tục mua</Link>
        </div>
      </div>

      <Invoice order={order} />
    </section>
  );
}
