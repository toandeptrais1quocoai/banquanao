import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, priority = false }) {
  const hasSale = Boolean(product.originalPrice && product.originalPrice > product.price);
  const colors = product.colors?.length
    ? product.colors
    : [{ name: product.colorName, hex: product.colorHex }];

  return (
    <article className="card shop-card">
      <div className="thumb">
        <Link to={`/san-pham/${product.slug}`} className="thumb-link">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </Link>
        {hasSale ? <span className="sale-badge">-{product.discountPercent}%</span> : null}
        {product.isFeatured && !hasSale ? <span className="badge">Nổi bật</span> : null}
      </div>

      <div className="card-body">
        <div className="swatch-row" aria-label="Màu có sẵn">
          {colors.slice(0, 4).map((item) => (
            <i
              key={item.name}
              className="swatch"
              style={{ background: item.hex }}
              title={item.name}
            />
          ))}
        </div>
        <Link className="card-link" to={`/san-pham/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="card-meta-line">
          {product.sizes?.length ? `${product.sizes.length} size` : 'Có size'}
          {' · '}
          {colors.length} màu
        </p>
        <div className="price-row">
          <strong className="price">{formatPrice(product.price)}</strong>
          {hasSale ? <s>{formatPrice(product.originalPrice)}</s> : null}
        </div>
        <Link className="btn-buy" to={`/san-pham/${product.slug}`}>
          Mua ngay
        </Link>
      </div>
    </article>
  );
}
