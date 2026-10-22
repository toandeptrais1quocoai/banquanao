import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../api/client';
import { formatPrice } from '../../utils/format';

export default function AdminRevenue() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Doanh thu — Quản trị NT shop';
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

  if (loading) return <p className="status">Đang tải doanh thu…</p>;
  if (error) return <p className="status">{error}</p>;
  if (!stats) return null;

  const cards = [
    { label: 'Doanh thu', value: formatPrice(stats.revenue) },
    { label: 'Tiền lời', value: formatPrice(stats.profit) },
    { label: 'Giá gốc', value: formatPrice(stats.costOfGoods) },
    { label: 'Đã bán (SP)', value: stats.soldTotal ?? 0 },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Doanh thu</h1>
          <p>Tiền lời tính theo đơn chưa hủy. Tồn kho / nhập hàng xem ở mục Kho.</p>
        </div>
        <Link className="btn btn-line" to="/admin/kho">
          Sang kho →
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
          <h2>Sản phẩm đã bán</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đã bán</th>
                <th>Doanh thu</th>
                <th>Tiền lời</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.sold}</td>
                  <td>{formatPrice(item.revenue)}</td>
                  <td>{formatPrice(item.profit || 0)}</td>
                </tr>
              ))}
              {!stats.topProducts.length ? (
                <tr>
                  <td colSpan={4}>Chưa có dữ liệu bán.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
