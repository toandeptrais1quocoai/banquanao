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
      <div className="topbar">
        <div className="wrap topbar-inner">
          <p>Chào mừng đến NT shop — thời trang &amp; giày dép</p>
          <div className="topbar-links">
            <Link to="/huong-dan-size">Hướng dẫn size</Link>
            <Link to="/gio-hang">Giỏ hàng</Link>
            {user ? (
              <button type="button" className="linkish" onClick={logout}>Đăng xuất</button>
            ) : (
              <>
                <Link to="/dang-nhap">Đăng nhập</Link>
                <Link to="/dang-ky">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <header className="shop-header">
        <div className="wrap shop-header-inner">
          <Link to="/" className="shop-logo">
            <span className="shop-logo-mark">NT</span>
            <span>
              <strong>NT shop</strong>
              <small>Thời trang</small>
            </span>
          </Link>

          <form className="shop-search" onSubmit={onSearch} role="search">
            <input
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Tìm kiếm"
            />
            <button type="submit">Tìm kiếm</button>
          </form>

          <Link to="/gio-hang" className="shop-cart-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 7h14l-1.4 8.2a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.6L5.2 4H3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.2" fill="currentColor" />
              <circle cx="17" cy="20" r="1.2" fill="currentColor" />
            </svg>
            <span>Giỏ hàng</span>
            <em>{cart.itemCount}</em>
          </Link>
        </div>
      </header>

      <nav className="shop-nav" aria-label="Danh mục">
        <div className="wrap shop-nav-inner">
          <div className="shop-nav-links">
            <Link to="/" aria-current={isHome && !current && !params.get('q') ? 'page' : undefined}>
              Trang chủ
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/?danh-muc=${category.slug}`}
                aria-current={isHome && current === category.slug ? 'page' : undefined}
              >
                {category.name}
              </Link>
            ))}
            <Link to="/#san-pham">Mua ngay</Link>
          </div>
          <a className="shop-hotline" href="tel:0901234567">
            Hotline: <strong>0901.234.567</strong>
          </a>
        </div>
      </nav>

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
            <p className="footer-phone">Hotline: 0901.234.567</p>
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
              <li><Link to="/huong-dan-size">Hướng dẫn size</Link></li>
              <li><Link to="/gio-hang">Giỏ hàng</Link></li>
              <li><Link to="/dang-nhap">Đăng nhập</Link></li>
              <li><Link to="/quen-mat-khau">Quên mật khẩu</Link></li>
            </ul>
          </div>
          <div>
            <h2>Tài khoản</h2>
            {user ? (
              <>
                <p><strong>{user.fullName}</strong></p>
                <p>{user.email}</p>
                <p className="hello-foot">Xin chào, {givenName(user.fullName)}</p>
                <button type="button" className="btn btn-line btn-small" onClick={logout}>Đăng xuất</button>
              </>
            ) : (
              <ul>
                <li><Link to="/dang-nhap">Đăng nhập</Link></li>
                <li><Link to="/dang-ky">Đăng ký</Link></li>
              </ul>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
