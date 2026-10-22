import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../api/client';
import { formatPrice } from '../../utils/format';

const emptyForm = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  price: '',
  originalPrice: '',
  imageUrl: '/images/ao-thun.jpg',
  colorName: 'Đen',
  colorHex: '#111111',
  sizes: 'S,M,L,XL',
  material: 'Cotton',
  isFeatured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
        api.adminProducts('', search.trim()),
        api.adminCategories(),
      ]);
      setProducts(productData.products);
      setCategories(categoryData.categories);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Sản phẩm — Quản trị NT shop';
  }, []);

  useEffect(() => {
    load();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((item) => map.set(item.slug, item));
    return map;
  }, [categories]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
    });
    setMessage('');
  }

  function openEdit(product) {
    const category = categories.find((item) => item.slug === product.categorySlug)
      || categories.find((item) => item.id === product.categoryId);
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      categoryId: category ? String(category.id) : String(product.categoryId || ''),
      description: product.description || '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      imageUrl: product.imageUrl,
      colorName: product.colorName,
      colorHex: product.colorHex || '#cccccc',
      sizes: (product.sizes || []).join(','),
      material: product.material || 'Cotton',
      isFeatured: Boolean(product.isFeatured),
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
    const body = {
      ...form,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      originalPrice: form.originalPrice === '' ? null : Number(form.originalPrice),
      isFeatured: Boolean(form.isFeatured),
    };
    try {
      if (editingId) {
        await api.adminUpdateProduct(editingId, body);
        setMessage('Đã cập nhật sản phẩm.');
      } else {
        await api.adminCreateProduct(body);
        setMessage('Đã thêm sản phẩm. Vào mục Kho để nhập số lượng / giá vốn.');
      }
      await load();
      if (!editingId) openCreate();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(product) {
    if (!window.confirm(`Xóa “${product.name}”?`)) return;
    try {
      await api.adminDeleteProduct(product.id);
      if (editingId === product.id) openCreate();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSearch(event) {
    event.preventDefault();
    await load();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Sản phẩm</h1>
          <p>Danh mục bán hàng: tên, giá, ảnh, danh mục. Kho nhập/tồn xem ở mục Kho.</p>
        </div>
        <div className="admin-head-actions">
          <Link className="btn btn-line" to="/admin/kho">
            Sang kho →
          </Link>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <form className="admin-toolbar" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="Tìm sản phẩm…"
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
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Danh mục</th>
                  <th>Giá bán</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img className="admin-thumb" src={product.imageUrl} alt="" />
                    </td>
                    <td>
                      <strong>{product.name}</strong>
                      {product.isFeatured ? <span className="muted">Nổi bật</span> : null}
                    </td>
                    <td>{categoryMap.get(product.categorySlug)?.name || product.categoryName}</td>
                    <td>
                      {formatPrice(product.price)}
                      {product.originalPrice ? (
                        <span className="muted">gốc {formatPrice(product.originalPrice)}</span>
                      ) : null}
                    </td>
                    <td className="admin-row-actions">
                      <button type="button" onClick={() => openEdit(product)}>
                        Sửa
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(product)}>
                        Xóa
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
            <h2>{editingId ? `Sửa #${editingId}` : 'Thêm mới'}</h2>
          </div>
          {message ? <p className="alert ok">{message}</p> : null}
          <form className="admin-form" onSubmit={onSubmit}>
            <label>
              Tên
              <input required value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </label>
            <label>
              Slug (để trống tự tạo)
              <input value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
            </label>
            <label>
              Danh mục
              <select
                required
                value={form.categoryId}
                onChange={(e) => setField('categoryId', e.target.value)}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mô tả
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Giá bán
                <input
                  required
                  type="number"
                  min="1000"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                />
              </label>
              <label>
                Giá gốc (niêm yết)
                <input
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => setField('originalPrice', e.target.value)}
                />
              </label>
            </div>
            <label>
              Ảnh (đường dẫn)
              <input value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} />
            </label>
            <div className="admin-form-row">
              <label>
                Màu
                <input value={form.colorName} onChange={(e) => setField('colorName', e.target.value)} />
              </label>
              <label>
                Mã màu
                <input value={form.colorHex} onChange={(e) => setField('colorHex', e.target.value)} />
              </label>
            </div>
            <label>
              Size (cách nhau dấu phẩy)
              <input value={form.sizes} onChange={(e) => setField('sizes', e.target.value)} />
            </label>
            <label>
              Chất liệu
              <input value={form.material} onChange={(e) => setField('material', e.target.value)} />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setField('isFeatured', e.target.checked)}
              />
              Nổi bật
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu…' : editingId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
