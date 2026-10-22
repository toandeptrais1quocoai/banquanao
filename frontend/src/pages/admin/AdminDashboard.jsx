import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../api/client';
import { formatPrice } from '../../utils/format';
import { formatOrderStatus } from '../../utils/orderStatus';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Quản trị — NT shop';
    let ignore = false;
    api
      .adminStats()
      .then((data) => {
        if (!ignore) setStats(data.stats);
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
  }, []);

  if (loading) return <p className="status">Đang tải thống kê…</p>;
  if (error) return <p className="status">{error}</p>;
  if (!stats) return null;

  const cards = [
    { label: 'Đơn hàng', value: stats.orderCount },
    { label: 'Chờ xử lý', value: stats.pendingOrders },
    { label: 'Đơn hôm nay', value: stats.ordersToday },
    { label: 'Sản phẩm', value: stats.productCount },
    { label: 'Khách hàng', value: stats.customerCount },
    { label: 'Danh mục', value: stats.categoryCount },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Tổng quan</h1>
          <p>Theo dõi hoạt động gian hàng. Chi tiết tiền bạc xem ở Doanh thu.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/doanh-thu">
          Xem doanh thu
        </Link>
      </div>

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <article key={card.label} className="admin-stat-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2>Đơn gần đây</h2>
          <Link to="/admin/don-hang">Xem tất cả</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Khách</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.fullName}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <span className={`admin-badge status-${order.status}`}>
                      {formatOrderStatus(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {!stats.recentOrders.length ? (
                <tr>
                  <td colSpan={4}>Chưa có đơn hàng.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
