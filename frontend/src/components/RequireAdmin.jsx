import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAdmin() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <p className="status admin-loading">Đang kiểm tra quyền quản trị…</p>;
  }
  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
