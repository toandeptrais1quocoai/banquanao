import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product, priority = false }) {
  const hasSale = Boolean(product.originalPrice && product.originalPrice > product.price);
  const colors = product.colors?.length
    ? product.colors
    : [{ name: product.colorName, hex: product.colorHex, imageUrl: product.imageUrl }];
  const [preview, setPreview] = useState(null);
  const imageSrc = preview?.imageUrl || product.imageUrl;

  return (
    <article className="card shop-card">
      <div className="thumb">
        <Link to={`/san-pham/${product.slug}`} className="thumb-link">
          <img
            key={imageSrc}
            src={imageSrc}
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
            <button
              key={item.name}
              type="button"
              className={`swatch-btn${preview?.name === item.name ? ' is-on' : ''}`}
              style={{ background: item.hex }}
              title={item.name}
              aria-label={`Xem màu ${item.name}`}
              onMouseEnter={() => setPreview(item)}
              onMouseLeave={() => setPreview(null)}
              onFocus={() => setPreview(item)}
              onBlur={() => setPreview(null)}
              onClick={(event) => {
                event.preventDefault();
                setPreview(item);
              }}
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
          {preview ? ` · ${preview.name}` : ''}
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
