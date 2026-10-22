import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categories as fetchCategories, products as fetchProducts } from '../api/client';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/format';

const HERO_SLIDES = [
  {
    image: '/images/hero.jpg',
    tag: 'BST mới',
    title: 'Hè rực cháy — sale chạm đáy',
    lead: 'Áo · quần · váy · giày. Giảm đến 50%, giao COD toàn quốc.',
    cta: '#san-pham',
    ctaLabel: 'Mua ngay',
  },
  {
    image: '/images/ao-thun.jpg',
    tag: 'Áo mới',
    title: 'Áo thun & sơ mi mỗi ngày',
    lead: 'Form chuẩn, màu dễ phối — chọn size đúng với hướng dẫn NT shop.',
    cta: '/?danh-muc=ao',
    ctaLabel: 'Xem áo',
  },
  {
    image: '/images/giay-sneaker.jpg',
    tag: 'Giày dép',
    title: 'Sneaker & dép đi chơi',
    lead: 'Êm chân cả ngày, giá rõ trên từng món.',
    cta: '/?danh-muc=giay',
    ctaLabel: 'Xem giày',
  },
];

export default function HomePage() {
  const [params] = useSearchParams();
  const category = params.get('danh-muc') || '';
  const search = params.get('q') || '';
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState('');
  const hotRailRef = useRef(null);

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

  useEffect(() => {
    if (category || search) return undefined;
    const timer = window.setInterval(() => {
      setSlide((value) => (value + 1) % HERO_SLIDES.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [category, search]);

  useEffect(() => {
    setTab(category || '');
  }, [category]);

  const filteredMode = Boolean(category || search);
  const current = categories.find((item) => item.slug === category);
  const heading = search
    ? `Kết quả cho “${search}”`
    : current
      ? current.name
      : 'Tất cả sản phẩm';

  const hotSale = useMemo(() => {
    const sale = products.filter((item) => item.originalPrice && item.originalPrice > item.price);
    const list = sale.length ? sale : products.filter((item) => item.isFeatured);
    return (list.length ? list : products).slice(0, 10);
  }, [products]);

  const todayItems = useMemo(() => {
    if (!tab) return products;
    return products.filter((item) => item.categorySlug === tab);
  }, [products, tab]);

  function scrollHot(direction) {
    const rail = hotRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.min(rail.clientWidth * 0.8, 640), behavior: 'smooth' });
  }

  const activeHero = HERO_SLIDES[slide];

  return (
    <div className="home-shop">
      {!filteredMode ? (
        <>
          <section className="hero-slider" aria-label="Khuyến mãi">
            {HERO_SLIDES.map((item, index) => (
              <div
                key={item.title}
                className={`hero-slide${index === slide ? ' is-on' : ''}`}
                aria-hidden={index !== slide}
              >
                <img src={item.image} alt="" />
              </div>
            ))}
            <div className="hero-copy">
              <p className="hero-tag">{activeHero.tag}</p>
              <h1>{activeHero.title}</h1>
              <p>{activeHero.lead}</p>
              {activeHero.cta.startsWith('#') ? (
                <a className="btn btn-buy-hero" href={activeHero.cta}>
                  {activeHero.ctaLabel}
                </a>
              ) : (
                <Link className="btn btn-buy-hero" to={activeHero.cta}>
                  {activeHero.ctaLabel}
                </Link>
              )}
            </div>
            <div className="hero-dots" role="tablist" aria-label="Chọn banner">
              {HERO_SLIDES.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={index === slide ? 'is-on' : undefined}
                  aria-label={`Banner ${index + 1}`}
                  aria-selected={index === slide}
                  onClick={() => setSlide(index)}
                />
              ))}
            </div>
          </section>

          <section className="hot-sale" aria-label="Hot sale cuối tuần">
            <div className="hot-sale-head">
              <span className="hot-bolt" aria-hidden="true">
                ⚡
              </span>
              <h2>Hot sale cuối tuần</h2>
            </div>
            <div className="hot-sale-body">
              <button type="button" className="hot-arrow prev" onClick={() => scrollHot(-1)} aria-label="Trước">
                ‹
              </button>
              <div className="hot-rail" ref={hotRailRef}>
                {loading ? <p className="status light">Đang tải…</p> : null}
                {!loading
                  ? hotSale.map((product) => (
                      <Link key={product.id} to={`/san-pham/${product.slug}`} className="hot-card">
                        <div className="hot-thumb">
                          <img src={product.imageUrl} alt="" loading="lazy" />
                          {product.discountPercent ? (
                            <span className="sale-badge">-{product.discountPercent}%</span>
                          ) : null}
                        </div>
                        <div className="hot-body">
                          <span
                            className="hot-swatch"
                            style={{ background: product.colorHex || '#ccc' }}
                            aria-hidden="true"
                          />
                          <strong>{product.name}</strong>
                          <em>{formatPrice(product.price)}</em>
                        </div>
                      </Link>
                    ))
                  : null}
              </div>
              <button type="button" className="hot-arrow next" onClick={() => scrollHot(1)} aria-label="Sau">
                ›
              </button>
            </div>
          </section>

          <section id="san-pham" className="today-buy">
            <h2>Hôm nay mua gì?</h2>
            <div className="today-tabs" role="tablist" aria-label="Lọc nhanh">
              <button
                type="button"
                className={!tab ? 'is-on' : undefined}
                onClick={() => setTab('')}
              >
                Toàn bộ
              </button>
              {categories.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  className={tab === item.slug ? 'is-on' : undefined}
                  onClick={() => setTab(item.slug)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            {error ? <p className="status">{error}</p> : null}
            {loading ? <p className="status">Đang mở gian hàng…</p> : null}
            {!loading && !error && todayItems.length === 0 ? (
              <p className="status">Chưa có món trong mục này.</p>
            ) : null}
            {!loading && !error ? (
              <div className="grid shop-grid">
                {todayItems.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 5} />
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <section id="san-pham" className="catalog catalog-page">
          <div className="section-head shop-section-head">
            <div>
              <p className="kicker">Cửa hàng</p>
              <h2>{heading}</h2>
            </div>
            <p className="count">{loading ? 'Đang tải' : `${products.length} sản phẩm`}</p>
          </div>
          <nav className="filters today-tabs" aria-label="Lọc danh mục">
            <Link to="/" className={`filter${!category && !search ? ' is-on' : ''}`}>
              Toàn bộ
            </Link>
            {categories.map((item) => (
              <Link
                key={item.slug}
                to={`/?danh-muc=${item.slug}`}
                className={`filter${category === item.slug ? ' is-on' : ''}`}
              >
                {item.name}
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
        </section>
      )}
    </div>
  );
}
