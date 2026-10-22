import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { categories as fetchCategories } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { givenName } from '../utils/format';

export default function Layout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const current = params.get('danh-muc') || '';
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(params.get('q') || '');
  const isHome = pathname === '/';

  useEffect(() => {
    let ignore = false;
    fetchCategories()
      .then((data) => {
        if (!ignore) setCategories(data.categories);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setQuery(params.get('q') || '');
  }, [params]);

  function onSearch(event) {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate(`/?q=${encodeURIComponent(q)}`);
    else navigate('/');
  }

  return (
    <div className="shell shop-shell">
      <div className="promo-bar">
        <div className="wrap promo-bar-inner">
          <p>
            <strong>Sale như mơ</strong> — giảm online đến 50%. Freeship đơn từ 399K.
          </p>
          <Link to="/#san-pham" className="promo-bar-cta">
            Xem ngay
          </Link>
        </div>
      </div>

      <header className="shop-header">
        <div className="wrap shop-header-inner">
          <Link to="/" className="shop-logo">
            <span className="shop-logo-mark">NT</span>
            <strong>NT shop</strong>
          </Link>

          <nav className="shop-nav-links" aria-label="Danh mục">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/?danh-muc=${category.slug}`}
                aria-current={isHome && current === category.slug ? 'page' : undefined}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <form className="shop-search" onSubmit={onSearch} role="search">
            <input
              type="search"
              placeholder="Tìm kiếm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Tìm kiếm"
            />
            <button type="submit" aria-label="Tìm">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          <div className="shop-header-actions">
            {user ? (
              <div className="shop-account">
                <span className="shop-account-name">{givenName(user.fullName)}</span>
                <button type="button" className="linkish light" onClick={logout}>
                  Thoát
                </button>
              </div>
            ) : (
              <Link to="/dang-nhap" className="shop-account-link">
                Đăng nhập
              </Link>
            )}
            <Link to="/gio-hang" className="shop-cart-btn" aria-label="Giỏ hàng">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.6L5.2 4H3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="20" r="1.2" fill="currentColor" />
                <circle cx="17" cy="20" r="1.2" fill="currentColor" />
              </svg>
              <em>{cart.itemCount}</em>
            </Link>
          </div>
        </div>
      </header>

      <main className="page">
        <div className="wrap page-pad">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer shop-footer">
        <div className="wrap footer-grid">
          <div>
            <p className="logo-footer">NT shop</p>
            <p>Thời trang, giày dép mỗi ngày. Giao COD toàn quốc.</p>
            <p className="footer-phone">Hotline: 0325.589.396</p>
          </div>
          <div>
            <h2>Danh mục</h2>
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link to={`/?danh-muc=${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Hỗ trợ</h2>
            <ul>
              <li>
                <Link to="/huong-dan-size">Hướng dẫn size</Link>
              </li>
              <li>
                <Link to="/gio-hang">Giỏ hàng</Link>
              </li>
              <li>
                <Link to="/dang-nhap">Đăng nhập</Link>
              </li>
              <li>
                <Link to="/quen-mat-khau">Quên mật khẩu</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2>Tài khoản</h2>
            {user ? (
              <>
                <p>
                  <strong>{user.fullName}</strong>
                </p>
                <p>{user.email}</p>
                <button type="button" className="btn btn-line btn-small" onClick={logout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <ul>
                <li>
                  <Link to="/dang-nhap">Đăng nhập</Link>
                </li>
                <li>
                  <Link to="/dang-ky">Đăng ký</Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
