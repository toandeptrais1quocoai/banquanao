import { useState } from 'react';

export function TextField({ label, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export function PasswordField({ label, error, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="password">
        <input {...props} type={visible ? 'text' : 'password'} />
        <button type="button" onClick={() => setVisible((value) => !value)}>
          {visible ? 'Ẩn' : 'Hiện'}
        </button>
      </span>
      {error ? <small>{error}</small> : null}
    </label>
  );
}
