import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import { PasswordField, TextField } from '../components/Field';
import { isEmail } from '../utils/format';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = 'Quên mật khẩu — NT shop';
  }, []);

  async function requestCode(event) {
    event.preventDefault();
    if (!isEmail(email.trim())) {
      setErrors({ email: 'Email chưa đúng định dạng.' });
      return;
    }
    setErrors({});
    setFormError('');
    setPending(true);
    try {
      const data = await forgotPassword(email.trim());
      setNotice(data.message || 'Đã gửi mã OTP vào Gmail của bạn.');
      setCode('');
      setStep(2);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPending(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const next = {};
    if (!/^\d{6}$/.test(code.trim())) next.code = 'Mã gồm 6 chữ số.';
    if (password.length < 6) next.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    if (password !== confirm) next.confirm = 'Mật khẩu nhập lại chưa khớp.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    setFormError('');
    try {
      const data = await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });
      navigate('/dang-nhap', { state: { notice: data.message } });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      kicker="Tài khoản"
      title={step === 1 ? 'Quên mật khẩu' : 'Đặt mật khẩu mới'}
      lead={step === 1
        ? 'Nhập Gmail đã đăng ký. Mã OTP 6 số sẽ gửi về hộp thư của bạn.'
        : 'Mở Gmail, lấy mã OTP 6 số rồi đặt mật khẩu mới. Mã hết hạn sau 15 phút.'}
      aside={{
        title: 'OTP gửi qua Gmail.',
        text: 'Mã chỉ gửi vào email, không hiện trên web. Kiểm tra Hộp thư đến và Spam.',
      }}
    >
      {formError ? <p className="alert" role="alert">{formError}</p> : null}
      {step === 1 ? (
        <form onSubmit={requestCode} noValidate>
          <TextField
            label="Gmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />
          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            {pending ? 'Đang gửi OTP…' : 'Gửi mã OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={changePassword} noValidate>
          {notice ? <p className="alert ok" role="status">{notice}</p> : null}
          <TextField
            label="Mã OTP 6 số (trong Gmail)"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={errors.code}
          />
          <PasswordField
            label="Mật khẩu mới"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <PasswordField
            label="Nhập lại mật khẩu"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={errors.confirm}
          />
          <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
            {pending ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </button>
        </form>
      )}
      <div className="form-links">
        <Link to="/dang-nhap">Về đăng nhập</Link>
        {step === 2 ? (
          <button type="button" className="text-btn" onClick={() => setStep(1)}>Đổi email</button>
        ) : null}
      </div>
    </AuthLayout>
  );
}
