import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { changePassword } from '../api/client';
import { PasswordField } from '../components/Field';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  const { user, ready } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = 'Đổi mật khẩu — NT shop';
  }, []);

  if (!ready) return <p className="status">Đang kiểm tra phiên…</p>;
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: '/doi-mat-khau' }} />;

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!currentPassword) next.currentPassword = 'Bạn nhập mật khẩu hiện tại giúp.';
    if (newPassword.length < 6) next.newPassword = 'Mật khẩu mới cần ít nhất 6 ký tự.';
    if (newPassword !== confirm) next.confirm = 'Mật khẩu nhập lại chưa khớp.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setFormError('');
    setNotice('');
    try {
      const data = await changePassword({ currentPassword, newPassword });
      setNotice(data.message || 'Đã đổi mật khẩu.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="account-page account-page-narrow">
      <div className="section-head">
        <div>
          <p className="kicker">Tài khoản</p>
          <h2>Đổi mật khẩu</h2>
        </div>
        <Link className="text-btn" to="/don-hang">
          Trạng thái đơn
        </Link>
      </div>

      <form className="checkout-form" onSubmit={onSubmit} noValidate>
        {formError ? <p className="alert" role="alert">{formError}</p> : null}
        {notice ? (
          <p className="alert ok" role="status">
            {notice}
          </p>
        ) : null}
        <PasswordField
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errors.currentPassword}
        />
        <PasswordField
          label="Mật khẩu mới"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
        />
        <PasswordField
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
        />
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? 'Đang lưu…' : 'Đổi mật khẩu'}
        </button>
      </form>
    </section>
  );
}
