import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../api/client';
import { formatPrice } from '../../utils/format';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [costPrice, setCostPrice] = useState('');
  const [importQty, setImportQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [productData, categoryData, statsData] = await Promise.all([
        api.adminProducts('', search.trim()),
        api.adminCategories(),
        api.adminStats(),
      ]);
      setProducts(productData.products);
      setCategories(categoryData.categories);
      setStats(statsData.stats);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Kho — Quản trị NT shop';
    load();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((item) => map.set(item.slug, item));
    return map;
  }, [categories]);

  function openEdit(product) {
    setEditing(product);
    setCostPrice(String(product.costPrice ?? 0));
    setImportQty(String(product.importQty ?? 0));
    setMessage('');
  }

  async function onSearch(event) {
    event.preventDefault();
    await load();
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage('');
    try {
      const data = await api.adminUpdateInventory(editing.id, {
        costPrice: Number(costPrice),
        importQty: Number(importQty),
      });
      setMessage('Đã cập nhật kho.');
      setEditing(data.product);
      setCostPrice(String(data.product.costPrice ?? 0));
      setImportQty(String(data.product.importQty ?? 0));
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  const soldQty = editing?.soldQty ?? 0;
  const stockPreview = Math.max(0, Number(importQty || 0) - soldQty);

  const summaryCards = stats
    ? [
        { label: 'Tồn kho (SP)', value: stats.stockTotal },
        { label: 'Đã nhập (SP)', value: stats.importTotal },
        { label: 'Đã bán (SP)', value: stats.soldTotal ?? 0 },
        { label: 'Giá trị tồn kho', value: formatPrice(stats.inventoryValue) },
      ]
    : [];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Kho</h1>
          <p>Tồn kho = số nhập − số đã bán. Sửa số nhập và giá vốn tại đây.</p>
        </div>
        <Link className="btn btn-line" to="/admin/san-pham">
          ← Sản phẩm
        </Link>
      </div>

      {summaryCards.length ? (
        <div className="admin-stat-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className="admin-stat-card">
              <p>{card.label}</p>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>
      ) : null}

      {(stats?.lowStock || []).length ? (
        <section className="admin-panel" style={{ marginBottom: 16 }}>
          <div className="admin-panel-head">
            <h2>Tồn kho thấp</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Tồn</th>
                  <th>Đã nhập</th>
                  <th>Giá vốn</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.map((item) => {
                  const product = products.find((p) => p.id === item.id);
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="stock-low">{item.stockQty}</td>
                      <td>{item.importQty}</td>
                      <td>{formatPrice(item.costPrice)}</td>
                      <td className="admin-row-actions">
                        {product ? (
                          <button type="button" onClick={() => openEdit(product)}>
                            Sửa kho
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="admin-split">
        <section className="admin-panel">
          <form className="admin-toolbar" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="Tìm trong kho…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" className="btn btn-line">
              Tìm
            </button>
          </form>
          {error ? <p className="status">{error}</p> : null}
          {loading ? <p className="status">Đang tải…</p> : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Giá vốn</th>
                  <th>Nhập</th>
                  <th>Đã bán</th>
                  <th>Tồn</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <span className="muted">
                        {categoryMap.get(product.categorySlug)?.name || product.categoryName}
                      </span>
                    </td>
                    <td>{formatPrice(product.costPrice || 0)}</td>
                    <td>{product.importQty ?? 0}</td>
                    <td>{product.soldQty ?? 0}</td>
                    <td className={product.stockQty <= 5 ? 'stock-low' : undefined}>
                      {product.stockQty ?? 0}
                    </td>
                    <td className="admin-row-actions">
                      <button type="button" onClick={() => openEdit(product)}>
                        Sửa kho
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>{editing ? `Kho #${editing.id}` : 'Chọn món để sửa kho'}</h2>
          </div>
          {!editing ? <p className="status">Chọn “Sửa kho” ở bảng bên trái.</p> : null}
          {editing ? (
            <form className="admin-form" onSubmit={onSubmit}>
              {message ? <p className="alert ok">{message}</p> : null}
              <p>
                <strong>{editing.name}</strong>
                <span className="muted"> Giá bán {formatPrice(editing.price)}</span>
              </p>
              <label>
                Giá vốn
                <input
                  required
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </label>
              <label>
                Lời / món
                <input
                  readOnly
                  value={formatPrice(Math.max(0, editing.price - (Number(costPrice) || 0)))}
                />
              </label>
              <label>
                Số lượng nhập
                <input
                  required
                  type="number"
                  min="0"
                  value={importQty}
                  onChange={(e) => setImportQty(e.target.value)}
                />
              </label>
              <label>
                Đã bán
                <input readOnly value={String(soldQty)} />
              </label>
              <label>
                Tồn kho (nhập − đã bán)
                <input readOnly value={String(stockPreview)} />
              </label>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : 'Lưu kho'}
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
