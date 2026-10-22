import { useEffect, useMemo, useState } from 'react';
import * as api from '../../api/client';
import Invoice from '../../components/Invoice';
import { formatPrice } from '../../utils/format';
import { formatOrderStatus } from '../../utils/orderStatus';

const STATUSES = [
  { value: 'awaiting_payment', label: 'Chờ thanh toán' },
  { value: 'pending', label: 'Đã đặt đơn' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'done', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const [printOrders, setPrintOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const allChecked = orders.length > 0 && orders.every((order) => checkedIds.has(order.id));
  const checkedCount = useMemo(() => checkedIds.size, [checkedIds]);

  async function load() {
    setLoading(true);
    try {
      const data = await api.adminOrders();
      setOrders(data.orders);
      setCheckedIds((prev) => {
        const next = new Set();
        for (const order of data.orders) {
          if (prev.has(order.id)) next.add(order.id);
        }
        return next;
      });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Đơn hàng — Quản trị NT shop';
    load();
  }, []);

  function toggleOne(id) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(new Set());
      return;
    }
    setCheckedIds(new Set(orders.map((order) => order.id)));
  }

  async function openOrder(id) {
    try {
      const data = await api.adminOrder(id);
      setSelected(data.order);
      setPrintOrders([data.order]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(id, status) {
    setBusyId(id);
    try {
      await api.adminUpdateOrderStatus(id, status);
      await load();
      if (selected?.id === id) {
        const data = await api.adminOrder(id);
        setSelected(data.order);
        setPrintOrders([data.order]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function loadOrdersForPrint(ids) {
    const unique = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    const results = await Promise.all(unique.map((id) => api.adminOrder(id)));
    return results.map((item) => item.order);
  }

  function runPrint() {
    window.setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 80);
  }

  async function printSelected() {
    if (!checkedCount) return;
    setPrinting(true);
    setError('');
    try {
      const list = await loadOrdersForPrint([...checkedIds]);
      setPrintOrders(list);
      runPrint();
    } catch (err) {
      setError(err.message);
      setPrinting(false);
    }
  }

  function printOne() {
    if (!selected) return;
    setPrinting(true);
    setPrintOrders([selected]);
    runPrint();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head admin-print-hide">
        <div>
          <h1>Đơn hàng</h1>
          <p>Xem và cập nhật trạng thái đơn COD / chuyển khoản QR.</p>
        </div>
        <div className="admin-page-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={!checkedCount || printing}
            onClick={printSelected}
          >
            {printing
              ? 'Đang chuẩn bị in…'
              : checkedCount
                ? `In ${checkedCount} hóa đơn đã chọn`
                : 'In hóa đơn đã chọn'}
          </button>
        </div>
      </div>

      {error ? <p className="status admin-print-hide">{error}</p> : null}
      {loading ? <p className="status admin-print-hide">Đang tải đơn…</p> : null}

      <div className="admin-split admin-print-hide">
        <section className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-col-check">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      aria-label="Chọn tất cả đơn"
                      disabled={!orders.length}
                    />
                  </th>
                  <th>#</th>
                  <th>Khách</th>
                  <th>Tổng</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={checkedIds.has(order.id) ? 'is-checked' : undefined}>
                    <td className="admin-col-check">
                      <input
                        type="checkbox"
                        checked={checkedIds.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        aria-label={`Chọn đơn #${order.id}`}
                      />
                    </td>
                    <td>{order.id}</td>
                    <td>
                      <strong>{order.fullName}</strong>
                      <span className="muted">{order.phone}</span>
                    </td>
                    <td>{formatPrice(order.total)}</td>
                    <td>
                      <select
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={(event) => changeStatus(order.id, event.target.value)}
                      >
                        {STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button type="button" onClick={() => openOrder(order.id)}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!orders.length && !loading ? (
                  <tr>
                    <td colSpan={6}>Chưa có đơn hàng.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Chi tiết đơn</h2>
            {selected ? (
              <button className="btn btn-primary btn-small" type="button" onClick={printOne}>
                In hóa đơn
              </button>
            ) : null}
          </div>
          {!selected ? <p className="status">Chọn một đơn để xem.</p> : null}
          {selected ? (
            <div className="admin-order-detail">
              <p>
                <strong>#{selected.id}</strong> · {formatOrderStatus(selected.status)}
              </p>
              <p>
                {selected.fullName} — {selected.phone}
              </p>
              <p>{selected.address}</p>
              {selected.note ? <p>Ghi chú: {selected.note}</p> : null}
              <p>
                Thanh toán:{' '}
                {selected.paymentMethod === 'QR' ? 'Chuyển khoản QR' : selected.paymentMethod || 'COD'}
              </p>
              <p>
                <strong>{formatPrice(selected.total)}</strong>
              </p>
              <ul>
                {selected.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} · {item.size}
                    {item.color ? ` · ${item.color}` : ''} × {item.quantity} —{' '}
                    {formatPrice(item.lineTotal)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      {printOrders.length ? (
        <div className="admin-invoice-print">
          {printOrders.map((order) => (
            <Invoice key={order.id} order={order} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
