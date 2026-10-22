import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { PasswordField, TextField } from '../components/Field';
import { useAuth } from '../context/AuthContext';
import { isEmail } from '../utils/format';

export default function RegisterPage() {
  const { user, ready, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = 'Đăng ký — NT shop';
  }, []);

  if (!ready) return <p className="status">Đang kiểm tra phiên…</p>;
  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event) {
    event.preventDefault();
    const name = fullName.trim().replace(/\s+/g, ' ');
    const phoneValue = phone.trim().replace(/\s+/g, '');
    const next = {};
    if (name.length < 2) next.fullName = 'Tên cần ít nhất 2 ký tự.';
    if (!isEmail(email.trim())) next.email = 'Email chưa đúng định dạng.';
    if (!/^(0|\+84)[0-9]{8,10}$/.test(phoneValue)) next.phone = 'Số điện thoại chưa đúng.';
    if (password.length < 6) next.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setFormError('');
    try {
      await register({ fullName: name, email: email.trim(), phone: phoneValue, password });
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
      title="Đăng ký"
      lead="Tạo tài khoản để lần sau vào gian hàng không phải đăng ký lại."
      aside={{
        title: 'Một email, một tài khoản.',
        text: 'Tên và email được lưu trong SQL Server, trên database BanQuanAo. Mật khẩu được băm, không để dạng chữ thường.',
      }}
    >
      {formError ? <p className="alert" role="alert">{formError}</p> : null}
      <form onSubmit={onSubmit} noValidate>
        <TextField
          label="Họ và tên"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <TextField
          label="Số điện thoại"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
        />
        <PasswordField
          label="Mật khẩu"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? 'Đang tạo…' : 'Tạo tài khoản'}
        </button>
      </form>
      <div className="form-links">
        <Link to="/dang-nhap">Đã có tài khoản? Đăng nhập</Link>
      </div>
    </AuthLayout>
  );
}
