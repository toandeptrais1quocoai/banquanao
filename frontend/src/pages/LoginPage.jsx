import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { PasswordField, TextField } from '../components/Field';
import { useAuth } from '../context/AuthContext';
import { isEmail } from '../utils/format';

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const notice = location.state?.notice || '';

  useEffect(() => {
    document.title = 'Đăng nhập — NT shop';
  }, []);

  if (!ready) return <p className="status">Đang kiểm tra phiên…</p>;
  if (user) return <Navigate to="/" replace />;

  function fillDemo() {
    setEmail('an@moc.local');
    setPassword('123456');
    setErrors({});
    setFormError('');
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!isEmail(email.trim())) next.email = 'Email chưa đúng định dạng.';
    if (!password) next.password = 'Bạn nhập mật khẩu giúp.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setFormError('');
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      kicker="Tài khoản"
      title="Đăng nhập"
      lead="Vào tài khoản để giữ phiên của bạn trên gian hàng."
      aside={{
        title: 'Gian hàng để trên máy bạn.',
        text: 'Đăng nhập bằng tài khoản đã tạo. Quên mật khẩu thì nhận mã OTP gửi về Gmail.',
      }}
    >
      {notice ? <p className="alert ok" role="status">{notice}</p> : null}
      {formError ? <p className="alert" role="alert">{formError}</p> : null}
      <form onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Mật khẩu"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? 'Đang vào…' : 'Đăng nhập'}
        </button>
      </form>
      <div className="form-links">
        <Link to="/quen-mat-khau">Quên mật khẩu</Link>
        <Link to="/dang-ky">Tạo tài khoản</Link>
      </div>
      <div className="demo">
        <span>Tài khoản mẫu <code>an@moc.local</code> / <code>123456</code></span>
        <button type="button" onClick={fillDemo}>Điền giúp</button>
      </div>
    </AuthLayout>
  );
}
