import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { product as fetchProduct, products as fetchProducts } from '../api/client';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const colors = product?.colors?.length
    ? product.colors
    : product
      ? [{ name: product.colorName, hex: product.colorHex, imageUrl: product.imageUrl }]
      : [];

  const activeColor = useMemo(
    () => colors.find((item) => item.name === color) || colors[0],
    [colors, color],
  );

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setProduct(null);
    setRelated([]);
    setSize('');
    setColor('');
    setQuantity(1);
    setFormError('');
    setNotice('');
    fetchProduct(slug)
      .then(async (data) => {
        if (ignore) return;
        setProduct(data.product);
        setSize(data.product.sizes[0] || '');
        const firstColor = data.product.colors?.[0]?.name || data.product.colorName || '';
        setColor(firstColor);
        document.title = `${data.product.name} — NT shop`;
        const list = await fetchProducts(data.product.categorySlug);
        if (!ignore) {
          setRelated(list.products.filter((item) => item.slug !== data.product.slug).slice(0, 4));
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          document.title = 'Không thấy món này — NT shop';
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [slug]);

  async function onAdd() {
    if (!product) return;
    if (!size) {
      setFormError('Bạn chọn size giúp.');
      return;
    }
    if (!color) {
      setFormError('Bạn chọn màu giúp.');
      return;
    }
    setPending(true);
    setFormError('');
    setNotice('');
    try {
      await addItem({ productId: product.id, size, color, quantity });
      setNotice(`Đã thêm ${quantity} món · ${color} · size ${size} vào giỏ.`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="status">Đang lấy món này…</p>;
  if (error || !product) {
    return (
      <div className="empty-page">
        <h1>Không thấy món này</h1>
        <p>{error || 'Món có thể đã được gỡ khỏi gian hàng.'}</p>
        <Link className="btn btn-primary" to="/">Về gian hàng</Link>
      </div>
    );
  }

  return (
    <>
      <article className="detail">
        <div className="detail-photo" key={activeColor?.imageUrl || product.imageUrl}>
          <img
            src={activeColor?.imageUrl || product.imageUrl}
            alt={`${product.name} — ${activeColor?.name || ''}`}
            fetchPriority="high"
            decoding="async"
          />
          {activeColor?.name ? (
            <span className="detail-photo-color">{activeColor.name}</span>
          ) : null}
        </div>
        <div className="detail-info">
          <p className="crumb">
            <Link to="/">Gian hàng</Link>
            <span>/</span>
            <Link to={`/?danh-muc=${product.categorySlug}`}>{product.categoryName}</Link>
          </p>
          <h1>{product.name}</h1>
          <div className="detail-price-row price-row">
            <p className="detail-price price">{formatPrice(product.price)}</p>
            {product.originalPrice ? (
              <>
                <s>{formatPrice(product.originalPrice)}</s>
                <span className="discount">-{product.discountPercent}%</span>
              </>
            ) : null}
          </div>
          <p className="detail-desc">{product.description}</p>

          <p className="size-label">Chọn màu</p>
          <div className="color-picks" role="group" aria-label="Màu">
            {colors.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`color-pick${color === item.name ? ' is-on' : ''}`}
                aria-pressed={color === item.name}
                title={item.name}
                onClick={() => setColor(item.name)}
              >
                <i style={{ background: item.hex }} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          <p className="size-label">Chọn size</p>
          <div className="sizes" role="group" aria-label="Size">
            {product.sizes.map((value) => (
              <button
                key={value}
                type="button"
                className={`size${size === value ? ' is-on' : ''}`}
                aria-pressed={size === value}
                onClick={() => setSize(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <dl className="specs">
            <div className="spec">
              <dt>Chất liệu</dt>
              <dd>{product.material}</dd>
            </div>
            <div className="spec">
              <dt>Danh mục</dt>
              <dd>{product.categoryName}</dd>
            </div>
          </dl>

          <p className="size-label">Số lượng</p>
          <div className="qty">
            <button
              type="button"
              aria-label="Giảm"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              aria-label="Tăng"
              disabled={quantity >= 20}
              onClick={() => setQuantity((value) => Math.min(20, value + 1))}
            >
              +
            </button>
          </div>
          {formError ? <p className="alert" role="alert">{formError}</p> : null}
          {notice ? <p className="alert ok" role="status">{notice}</p> : null}
          <div className="buy-row">
            <button className="btn btn-primary" type="button" disabled={pending} onClick={onAdd}>
              {pending ? 'Đang thêm…' : 'Thêm vào giỏ'}
            </button>
            <Link className="btn btn-line" to="/gio-hang">Xem giỏ</Link>
          </div>
        </div>
      </article>
      {related.length > 0 ? (
        <section className="related">
          <div className="section-head">
            <div>
              <p className="kicker">Cùng mục</p>
              <h2>{product.categoryName}</h2>
            </div>
          </div>
          <div className="grid shop-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
