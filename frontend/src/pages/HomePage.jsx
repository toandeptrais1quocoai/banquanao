import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categories as fetchCategories, products as fetchProducts } from '../api/client';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { givenName } from '../utils/format';

export default function HomePage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const category = params.get('danh-muc') || '';
  const search = params.get('q') || '';
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = search
      ? `Tìm “${search}” — NT shop`
      : category
        ? `${category} — NT shop`
        : 'NT shop — Thời trang & giày dép';
  }, [category, search]);

  useEffect(() => {
    let ignore = false;
    fetchCategories()
      .then((data) => {
        if (!ignore) setCategories(data.categories);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchProducts(category, search)
      .then((data) => {
        if (!ignore) {
          setProducts(data.products);
          setError('');
        }
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
  }, [category, search]);

  const current = categories.find((item) => item.slug === category);
  const grouped = useMemo(() => {
    if (category || search) return [];
    return categories
      .map((item) => ({
        ...item,
        items: products.filter((product) => product.categorySlug === item.slug).slice(0, 4),
      }))
      .filter((item) => item.items.length);
  }, [categories, products, category, search]);

  const filteredMode = Boolean(category || search);
  const heading = search
    ? `Kết quả cho “${search}”`
    : current
      ? current.name
      : 'Tất cả sản phẩm';

  return (
    <div className="home-shop">
      {!filteredMode ? (
        <>
          <section className="promo-hero">
            <div className="promo-main">
              <img src="/images/hero.jpg" alt="" />
              <div className="promo-copy">
                <p className="promo-tag">BST mới</p>
                <h1>NT shop</h1>
                <p>
                  {user
                    ? `Xin chào ${givenName(user.fullName)} — chọn đồ, thêm giỏ, thanh toán COD.`
                    : 'Áo · quần · váy · giày · dép. Giá rõ, size đủ, giao COD.'}
                </p>
                <a className="btn btn-buy-hero" href="#san-pham">Mua ngay</a>
              </div>
            </div>
            <div className="promo-side">
              <Link to="/?danh-muc=ao" className="promo-tile">
                <img src="/images/ao-thun.jpg" alt="" />
                <span>Áo mới · từ 289K</span>
              </Link>
              <Link to="/?danh-muc=giay" className="promo-tile">
                <img src="/images/giay-sneaker.jpg" alt="" />
                <span>Giày dép · sale</span>
              </Link>
            </div>
          </section>

          <section className="cat-tiles" aria-label="Danh mục nổi bật">
            <h2>Danh mục sản phẩm</h2>
            <div className="cat-tile-grid">
              {categories.slice(0, 8).map((item) => (
                <Link key={item.slug} to={`/?danh-muc=${item.slug}`} className="cat-tile">
                  <strong>{item.name}</strong>
                  <span>{item.productCount} món</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section id="san-pham" className="catalog catalog-page">
        {filteredMode ? (
          <>
            <div className="section-head shop-section-head">
              <div>
                <p className="kicker">Cửa hàng</p>
                <h2>{heading}</h2>
              </div>
              <p className="count">{loading ? 'Đang tải' : `${products.length} sản phẩm`}</p>
            </div>
            <nav className="filters" aria-label="Lọc danh mục">
              <Link to="/" className="filter" aria-current={!category && !search ? 'page' : undefined}>
                Tất cả
              </Link>
              {categories.map((item) => (
                <Link
                  key={item.slug}
                  to={`/?danh-muc=${item.slug}`}
                  className="filter"
                  aria-current={category === item.slug ? 'page' : undefined}
                >
                  {item.name}
                  <span>{item.productCount}</span>
                </Link>
              ))}
            </nav>
            {error ? <p className="status">{error}</p> : null}
            {loading ? <p className="status">Đang mở gian hàng…</p> : null}
            {!loading && !error && products.length === 0 ? (
              <p className="status">Không tìm thấy sản phẩm phù hợp.</p>
            ) : null}
            {!loading && !error ? (
              <div className="grid shop-grid">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {error ? <p className="status">{error}</p> : null}
            {loading ? <p className="status">Đang mở gian hàng…</p> : null}
            {!loading && !error
              ? grouped.map((group) => (
                  <div key={group.slug} className="category-block">
                    <div className="section-head shop-section-head">
                      <h2>Sản phẩm {group.name}</h2>
                      <Link className="text-btn" to={`/?danh-muc=${group.slug}`}>
                        Xem tất cả →
                      </Link>
                    </div>
                    <div className="grid shop-grid">
                      {group.items.map((product, index) => (
                        <ProductCard key={product.id} product={product} priority={index < 2} />
                      ))}
                    </div>
                  </div>
                ))
              : null}
          </>
        )}
      </section>
    </div>
  );
}
