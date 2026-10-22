import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="empty-page">
      <p className="kicker">404</p>
      <h1>Không thấy trang này</h1>
      <p>Đường dẫn không có trong gian hàng.</p>
      <Link className="btn btn-primary" to="/">Về gian hàng</Link>
    </div>
  );
}
