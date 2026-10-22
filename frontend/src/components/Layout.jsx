import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { categories as fetchCategories } from '../api/client';
import ChatBee from './ChatBee';
import IntroSplash from './IntroSplash';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onPointer(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function onSearch(event) {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate(`/?q=${encodeURIComponent(q)}`);
    else navigate('/');
  }

  function onLogout() {
    setMenuOpen(false);
    logout();
    navigate('/');
  }

  return (
    <div className="shell shop-shell">
      <IntroSplash />
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
          <Link to="/" className="shop-logo" aria-label="NT shop — trang chủ">
            <img className="shop-logo-img" src="/logo.svg" width="40" height="40" alt="" />
            <span className="shop-logo-text">
              <strong>NT shop</strong>
              <small>Fashion</small>
            </span>
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
              <div className="shop-account-menu" ref={menuRef}>
                <button
                  type="button"
                  className="shop-account-btn"
                  aria-label="Tài khoản"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M5 19.2c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {menuOpen ? (
                  <div className="shop-account-dropdown" role="menu">
                    <p className="shop-account-dropdown-name">{givenName(user.fullName)}</p>
                    {user.role === 'admin' ? (
                      <Link role="menuitem" to="/admin" onClick={() => setMenuOpen(false)}>
                        Quản trị
                      </Link>
                    ) : null}
                    <Link role="menuitem" to="/doi-mat-khau" onClick={() => setMenuOpen(false)}>
                      Đổi mật khẩu
                    </Link>
                    <Link role="menuitem" to="/don-hang" onClick={() => setMenuOpen(false)}>
                      Trạng thái đơn hàng
                    </Link>
                    <button type="button" role="menuitem" onClick={onLogout}>
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
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

      <ChatBee />

      <footer className="site-footer shop-footer">
        <div className="wrap footer-grid">
          <div>
            <p className="logo-footer">
              <img src="/logo.svg" width="36" height="36" alt="" />
              <span>NT shop</span>
            </p>
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
                <ul>
                  <li>
                    <Link to="/don-hang">Trạng thái đơn hàng</Link>
                  </li>
                  <li>
                    <Link to="/doi-mat-khau">Đổi mật khẩu</Link>
                  </li>
                </ul>
                <button type="button" className="btn btn-line btn-small" onClick={onLogout}>
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
