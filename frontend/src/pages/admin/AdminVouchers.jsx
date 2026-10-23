import { useEffect, useMemo, useState } from 'react';
import * as api from '../../api/client';
import { formatPrice } from '../../utils/format';
import { formatOrderStatus } from '../../utils/orderStatus';

const emptyForm = {
  code: '',
  type: 'percent',
  value: '',
  minOrderTotal: '0',
  maxDiscount: '',
  maxUses: '',
  active: true,
  note: '',
};

function describeVoucher(voucher) {
  if (voucher.type === 'percent') {
    const cap =
      voucher.maxDiscount != null ? ` · tối đa ${formatPrice(voucher.maxDiscount)}` : '';
    return `Giảm ${voucher.value}%${cap}`;
  }
  return `Giảm ${formatPrice(voucher.value)}`;
}

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [storefront, setStorefront] = useState({
    active: false,
    code: '',
    percent: '',
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMessage, setStoreMessage] = useState('');

  const [orders, setOrders] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [applyScope, setApplyScope] = useState('one');
  const [applyOrderId, setApplyOrderId] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  const selectedVoucher = vouchers.find((item) => item.code === selectedCode) || null;

  const eligibleOrders = useMemo(() => {
    return orders.filter((order) => order.status !== 'cancelled' && !order.voucherCode);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return eligibleOrders;
    return eligibleOrders.filter((order) => {
      const hay = `#${order.id} ${order.fullName} ${order.phone || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [eligibleOrders, orderSearch]);

  const storePreviewPercent = Number(storefront.percent) || 0;
  const storePreviewBase = 100000;
  const storePreviewSale =
    storePreviewPercent >= 1 && storePreviewPercent <= 99
      ? Math.round(storePreviewBase * (1 - storePreviewPercent / 100))
      : storePreviewBase;

  async function load() {
    setLoading(true);
    try {
      const [voucherData, orderData, storeData] = await Promise.all([
        api.adminVouchers(),
        api.adminOrders(),
        api.adminGetStorefrontVoucher(),
      ]);
      setVouchers(voucherData.vouchers);
      setOrders(orderData.orders || []);
      const sf = storeData.storefront || {};
      setStorefront({
        active: Boolean(sf.active),
        code: sf.code || '',
        percent: sf.percent != null ? String(sf.percent) : '',
      });
      setError('');
      if (selectedCode && !voucherData.vouchers.some((item) => item.code === selectedCode)) {
        setSelectedCode('');
      }
      if (
        applyOrderId &&
        !(orderData.orders || []).some(
          (order) =>
            String(order.id) === String(applyOrderId) &&
            order.status !== 'cancelled' &&
            !order.voucherCode,
        )
      ) {
        setApplyOrderId('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Voucher — Quản trị NT shop';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setShowOrderForm(true);
  }

  function openEdit(voucher) {
    setEditingId(voucher.id);
    setForm({
      code: voucher.code,
      type: voucher.type,
      value: String(voucher.value),
      minOrderTotal: String(voucher.minOrderTotal || 0),
      maxDiscount: voucher.maxDiscount != null ? String(voucher.maxDiscount) : '',
      maxUses: voucher.maxUses != null ? String(voucher.maxUses) : '',
      active: voucher.active,
      note: voucher.note || '',
    });
    setMessage('');
    setShowOrderForm(true);
  }

  function selectForApply(voucher) {
    setSelectedCode(voucher.code);
    setApplyMessage('');
    setApplyOrderId('');
    setOrderSearch('');
    setApplyScope('one');
  }

  function useVoucherOnStorefront(voucher) {
    if (voucher.type !== 'percent') {
      setStoreMessage('Voucher toàn shop chỉ dùng loại phần trăm (%).');
      return;
    }
    setStorefront({
      active: true,
      code: voucher.code,
      percent: String(voucher.value),
    });
    setStoreMessage(`Đã chọn ${voucher.code} (−${voucher.value}%) — bấm Lưu để hiện trên trang chủ.`);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setStoreField(key, value) {
    setStorefront((prev) => ({ ...prev, [key]: value }));
  }

  function buildBody() {
    return {
      code: form.code.trim(),
      type: form.type,
      value: Number(form.value),
      minOrderTotal: Number(form.minOrderTotal || 0),
      maxDiscount: form.maxDiscount.trim() === '' ? null : Number(form.maxDiscount),
      maxUses: form.maxUses.trim() === '' ? null : Number(form.maxUses),
      active: form.active,
      note: form.note.trim(),
    };
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const body = buildBody();
      if (editingId) {
        await api.adminUpdateVoucher(editingId, body);
        setMessage('Đã cập nhật mã đơn hàng.');
      } else {
        await api.adminCreateVoucher(body);
        setMessage('Đã tạo mã đơn hàng.');
        openCreate();
      }
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(voucher) {
    if (!window.confirm(`Xóa mã “${voucher.code}”?`)) return;
    try {
      await api.adminDeleteVoucher(voucher.id);
      if (editingId === voucher.id) {
        setEditingId(null);
        setForm(emptyForm);
        setShowOrderForm(false);
      }
      if (selectedCode === voucher.code) {
        setSelectedCode('');
        setApplyMessage('');
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSaveStorefront(event) {
    event.preventDefault();
    setStoreSaving(true);
    setStoreMessage('');
    try {
      const data = await api.adminSetStorefrontVoucher({
        active: storefront.active,
        code: storefront.code.trim(),
        percent: storefront.percent === '' ? null : Number(storefront.percent),
      });
      const sf = data.storefront || {};
      setStorefront({
        active: Boolean(sf.active),
        code: sf.code || '',
        percent: sf.percent != null ? String(sf.percent) : '',
      });
      setStoreMessage(
        sf.active
          ? `Đã bật trên trang chủ: mọi sản phẩm giảm ${sf.percent}%.`
          : 'Đã tắt voucher toàn shop trên trang chủ.',
      );
    } catch (err) {
      setStoreMessage(err.message);
    } finally {
      setStoreSaving(false);
    }
  }

  async function onApply(event) {
    event.preventDefault();
    if (!selectedCode) {
      setApplyMessage('Chọn một mã ở danh sách bên trái trước.');
      return;
    }
    setApplying(true);
    setApplyMessage('');
    try {
      const body = {
        code: selectedCode,
        scope: applyScope,
      };
      if (applyScope === 'one') {
        body.orderId = Number(applyOrderId);
      }
      const data = await api.adminApplyVoucher(body);
      if (applyScope === 'all') {
        setApplyMessage(`Đã áp dụng ${selectedCode} cho ${data.applied} đơn hàng.`);
      } else {
        setApplyMessage(`Đã áp dụng ${selectedCode} cho đơn #${body.orderId}.`);
      }
      setApplyOrderId('');
      await load();
    } catch (err) {
      setApplyMessage(err.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Voucher</h1>
          <p>
            Bên phải: giảm % mọi sản phẩm trên trang chủ. Bên trái + dưới: mã giảm theo đơn hàng.
          </p>
        </div>
        <button type="button" className="btn btn-line" onClick={openCreate}>
          + Mã giảm đơn hàng
        </button>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Mã giảm theo đơn</h2>
          </div>
          {error ? <p className="status">{error}</p> : null}
          {loading ? <p className="status">Đang tải…</p> : null}

          {showOrderForm ? (
            <form className="admin-form" onSubmit={onSubmit} style={{ marginBottom: '1rem' }}>
              <p className="muted">{editingId ? `Sửa mã #${editingId}` : 'Thêm mã để áp vào đơn hàng'}</p>
              {message ? (
                <p className={`alert ${message.startsWith('Đã') ? 'ok' : ''}`}>{message}</p>
              ) : null}
              <label>
                Mã
                <input
                  required
                  minLength={3}
                  maxLength={40}
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value.toUpperCase())}
                  placeholder="VD: VOUCHER10"
                />
              </label>
              <div className="admin-form-row">
                <label>
                  Loại
                  <select value={form.type} onChange={(e) => setField('type', e.target.value)}>
                    <option value="percent">%</option>
                    <option value="fixed">Số tiền</option>
                  </select>
                </label>
                <label>
                  Giá trị
                  <input
                    required
                    inputMode="numeric"
                    value={form.value}
                    onChange={(e) => setField('value', e.target.value.replace(/\D/g, ''))}
                  />
                </label>
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField('active', e.target.checked)}
                />
                Đang bật
              </label>
              <div className="admin-page-actions">
                <button
                  className="btn btn-line"
                  type="button"
                  onClick={() => {
                    setShowOrderForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Đóng
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Đang lưu…' : editingId ? 'Lưu' : 'Thêm mã'}
                </button>
              </div>
            </form>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Giảm</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr
                    key={voucher.id}
                    className={selectedCode === voucher.code ? 'is-checked' : undefined}
                  >
                    <td>
                      <strong>{voucher.code}</strong>
                      <span className="muted">{voucher.active ? 'Bật' : 'Tắt'}</span>
                    </td>
                    <td>{describeVoucher(voucher)}</td>
                    <td className="admin-row-actions">
                      <button type="button" onClick={() => selectForApply(voucher)}>
                        Áp đơn
                      </button>
                      {voucher.type === 'percent' ? (
                        <button type="button" onClick={() => useVoucherOnStorefront(voucher)}>
                          Lên trang chủ
                        </button>
                      ) : null}
                      <button type="button" onClick={() => openEdit(voucher)}>
                        Sửa
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(voucher)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {!vouchers.length && !loading ? (
                  <tr>
                    <td colSpan={3}>Chưa có mã giảm đơn.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Voucher toàn shop (trang chủ)</h2>
          </div>
          <p className="muted" style={{ marginTop: 0 }}>
            Khi bật, mọi sản phẩm trên web khách: giá bán = giá gốc − giá gốc × %.
          </p>
          {storeMessage ? (
            <p className={`alert ${storeMessage.startsWith('Đã') ? 'ok' : ''}`}>{storeMessage}</p>
          ) : null}
          <form className="admin-form" onSubmit={onSaveStorefront}>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={storefront.active}
                onChange={(e) => setStoreField('active', e.target.checked)}
              />
              Hiện trên trang chủ khách
            </label>
            <label>
              Tên mã hiển thị
              <input
                maxLength={40}
                value={storefront.code}
                onChange={(e) => setStoreField('code', e.target.value.toUpperCase())}
                placeholder="VD: VOUCHER20"
                disabled={!storefront.active}
              />
            </label>
            <label>
              Phần trăm giảm toàn shop
              <input
                required={storefront.active}
                inputMode="numeric"
                min={1}
                max={99}
                value={storefront.percent}
                onChange={(e) =>
                  setStoreField('percent', e.target.value.replace(/\D/g, '').slice(0, 2))
                }
                placeholder="VD: 20"
                disabled={!storefront.active}
              />
            </label>
            {storefront.active && storePreviewPercent >= 1 ? (
              <p className="admin-storefront-preview">
                Ví dụ giá gốc {formatPrice(storePreviewBase)} → bán{' '}
                <strong>{formatPrice(storePreviewSale)}</strong> (−{storePreviewPercent}%)
              </p>
            ) : null}
            <button className="btn btn-primary" type="submit" disabled={storeSaving}>
              {storeSaving ? 'Đang lưu…' : 'Lưu voucher trang chủ'}
            </button>
          </form>
        </section>
      </div>

      <section className="admin-panel admin-voucher-apply-panel">
        <div className="admin-panel-head">
          <h2>Áp dụng mã vào đơn hàng</h2>
        </div>
        {!vouchers.length ? (
          <p className="status">Thêm mã giảm đơn ở bên trái trước.</p>
        ) : !selectedVoucher ? (
          <p className="status">
            Bấm <strong>Áp đơn</strong> trên một mã ở danh sách bên trái.
          </p>
        ) : (
          <form className="admin-form admin-voucher-apply" onSubmit={onApply}>
            <p className="admin-voucher-picked">
              Đang chọn: <strong>{selectedVoucher.code}</strong>
              <span className="muted"> · {describeVoucher(selectedVoucher)}</span>
            </p>

            <fieldset className="admin-voucher-scope">
              <legend>Chọn cách áp dụng</legend>
              <label className="pay-option">
                <input
                  type="radio"
                  name="voucher-scope"
                  checked={applyScope === 'one'}
                  onChange={() => setApplyScope('one')}
                />
                <span>
                  <strong>Áp dụng với đơn hàng</strong>
                  <small>Chọn đơn từ danh sách bên dưới.</small>
                </span>
              </label>
              <label className="pay-option">
                <input
                  type="radio"
                  name="voucher-scope"
                  checked={applyScope === 'all'}
                  onChange={() => setApplyScope('all')}
                />
                <span>
                  <strong>Áp dụng với tất cả các đơn hàng</strong>
                  <small>
                    Gắn mã cho {eligibleOrders.length} đơn chưa có voucher (trừ đơn đã hủy).
                  </small>
                </span>
              </label>
            </fieldset>

            {applyScope === 'one' ? (
              <>
                <label>
                  Tìm đơn (tên / SĐT / số đơn)
                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="VD: An, 0901, 42…"
                  />
                </label>
                <label>
                  Chọn đơn hàng
                  <select
                    required
                    value={applyOrderId}
                    onChange={(e) => setApplyOrderId(e.target.value)}
                  >
                    <option value="">— Chọn đơn —</option>
                    {filteredOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        #{order.id} · {order.fullName} · {order.phone || '—'} ·{' '}
                        {formatPrice(order.total)} · {formatOrderStatus(order.status)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <p className="muted">
                Áp dụng {selectedVoucher.code} cho {eligibleOrders.length} đơn đủ điều kiện.
              </p>
            )}

            {applyMessage ? (
              <p className={`alert ${applyMessage.startsWith('Đã') ? 'ok' : ''}`}>{applyMessage}</p>
            ) : null}

            <button
              className="btn btn-primary"
              type="submit"
              disabled={applying || !selectedVoucher.active}
            >
              {applying
                ? 'Đang áp dụng…'
                : applyScope === 'all'
                  ? `Áp dụng ${selectedVoucher.code} cho tất cả đơn`
                  : `Áp dụng ${selectedVoucher.code} cho đơn này`}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
