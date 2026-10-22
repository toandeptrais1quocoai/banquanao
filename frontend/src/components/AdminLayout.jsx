import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', end: true, label: 'Tổng quan' },
  { to: '/admin/doanh-thu', label: 'Doanh thu' },
  { to: '/admin/san-pham', label: 'Sản phẩm' },
  { to: '/admin/kho', label: 'Kho' },
  { to: '/admin/don-hang', label: 'Đơn hàng' },
  { to: '/admin/khach-hang', label: 'Khách hàng' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/dang-nhap');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-aside">
        <div className="admin-brand">
          <img src="/logo.svg" width="36" height="36" alt="" />
          <div>
            <strong>NT shop</strong>
            <small>Quản trị gian hàng</small>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Quản trị">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-aside-foot">
          <p>{user?.fullName}</p>
          <p className="muted">{user?.email}</p>
          <button type="button" className="btn btn-line btn-small" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <p>Bảng điều khiển NT shop</p>
          <a className="text-btn" href="/" target="_blank" rel="noreferrer">
            Xem cửa hàng ↗
          </a>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
