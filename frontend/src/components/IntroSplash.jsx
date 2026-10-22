import { useEffect, useState } from 'react';

const STORAGE_KEY = 'nt_intro_done';

export default function IntroSplash() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  function onStart() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
      setVisible(false);
    }, 1100);
  }

  if (!visible) return null;

  return (
    <div
      className={`intro-splash${leaving ? ' is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chào mừng NT shop"
    >
      <div className="intro-splash-bg" aria-hidden="true">
        <span className="intro-orb intro-orb-a" />
        <span className="intro-orb intro-orb-b" />
        <span className="intro-orb intro-orb-c" />
        <span className="intro-grid" />
        <span className="intro-shine" />
        <span className="intro-beam" />
      </div>

      <div className="intro-splash-content">
        <p className="intro-kicker">Fashion · 2026</p>
        <h1 className="intro-brand" aria-label="NT shop">
          <span className="intro-brand-nt">NT</span>
          <span className="intro-brand-shop">shop</span>
        </h1>
        <div className="intro-rule" aria-hidden="true" />
        <p className="intro-tagline">Phong cách mỗi ngày — mở cửa hàng và khám phá.</p>

        <button type="button" className="intro-start" onClick={onStart}>
          <span className="intro-start-glow" aria-hidden="true" />
          <span className="intro-start-label">Start</span>
        </button>
      </div>

      <div className="intro-curtains" aria-hidden="true">
        <span className="intro-curtain intro-curtain-left" />
        <span className="intro-curtain intro-curtain-right" />
      </div>
    </div>
  );
}
