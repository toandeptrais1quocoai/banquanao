import { useEffect, useState } from 'react';
import * as api from '../../api/client';
import { formatPrice } from '../../utils/format';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.adminCustomers();
      setCustomers(data.customers);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Khách hàng — Quản trị NT shop';
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
  }

  function openEdit(customer) {
    setEditingId(customer.id);
    setForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone || '',
      password: '',
    });
    setMessage('');
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      if (editingId) {
        const body = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
        };
        if (form.password.trim()) body.password = form.password;
        await api.adminUpdateCustomer(editingId, body);
        setMessage('Đã cập nhật khách hàng.');
      } else {
        await api.adminCreateCustomer(form);
        setMessage('Đã thêm khách hàng.');
        openCreate();
      }
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(customer) {
    if (!window.confirm(`Xóa khách “${customer.fullName}”?`)) return;
    try {
      await api.adminDeleteCustomer(customer.id);
      if (editingId === customer.id) openCreate();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Khách hàng</h1>
          <p>Thêm, sửa, xóa tài khoản khách trên gian hàng.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Thêm khách
        </button>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          {error ? <p className="status">{error}</p> : null}
          {loading ? <p className="status">Đang tải…</p> : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khách</th>
                  <th>Điện thoại</th>
                  <th>Đơn</th>
                  <th>Đã mua</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.fullName}</strong>
                      <span className="muted">{customer.email}</span>
                    </td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.orderCount}</td>
                    <td>{formatPrice(customer.spent)}</td>
                    <td className="admin-row-actions">
                      <button type="button" onClick={() => openEdit(customer)}>
                        Sửa
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(customer)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {!customers.length && !loading ? (
                  <tr>
                    <td colSpan={5}>Chưa có khách hàng.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>{editingId ? `Sửa #${editingId}` : 'Thêm mới'}</h2>
          </div>
          {message ? <p className="alert ok">{message}</p> : null}
          <form className="admin-form" onSubmit={onSubmit}>
            <label>
              Họ tên
              <input
                required
                value={form.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </label>
            <label>
              Số điện thoại
              <input
                required
                type="tel"
                inputMode="tel"
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </label>
            <label>
              {editingId ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu'}
              <input
                type="password"
                required={!editingId}
                minLength={editingId ? undefined : 6}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm khách'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
