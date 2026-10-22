import { useEffect, useRef, useState } from 'react';
import { chat as sendChat } from '../api/client';

const WELCOME = {
  role: 'assistant',
  content:
    'Buzz! Mình là Ong NT — hỏi size, giá, ship, COD/QR hoặc tên món, mình trả lời ngay.',
};

function BeeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g className="chat-bee-wing chat-bee-wing-left">
        <ellipse cx="18" cy="22" rx="10" ry="7" fill="#dcecff" opacity="0.95" transform="rotate(-28 18 22)" />
      </g>
      <g className="chat-bee-wing chat-bee-wing-right">
        <ellipse cx="46" cy="22" rx="10" ry="7" fill="#dcecff" opacity="0.95" transform="rotate(28 46 22)" />
      </g>
      <g className="chat-bee-body">
        <ellipse cx="32" cy="36" rx="16" ry="18" fill="#f5c542" />
        <path d="M18 28c0-8 6-14 14-14s14 6 14 14" fill="#2b2118" />
        <ellipse cx="32" cy="30" rx="15" ry="6" fill="#2b2118" />
        <ellipse cx="32" cy="42" rx="15" ry="5" fill="#2b2118" />
        <circle cx="26" cy="20" r="2.2" fill="#fff" />
        <circle cx="38" cy="20" r="2.2" fill="#fff" />
        <circle cx="26.6" cy="20.4" r="1" fill="#1a120c" />
        <circle cx="38.6" cy="20.4" r="1" fill="#1a120c" />
        <path d="M28 12c-2-6-8-8-10-6 4 1 7 4 8 8zM36 12c2-6 8-8 10-6-4 1-7 4-8 8z" fill="#2b2118" />
      </g>
    </svg>
  );
}

export default function ChatBee() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, pending]);

  async function onSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const nextHistory = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setInput('');
    setPending(true);
    setError('');
    try {
      const data = await sendChat(
        text,
        nextHistory
          .filter((item) => item !== WELCOME)
          .slice(0, -1)
          .map((item) => ({ role: item.role, content: item.content })),
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Xin lỗi, mình đang bận một chút. Bạn thử lại giúp nhé.' },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`chat-bee${open ? ' is-open' : ''}`}>
      {open ? (
        <section className="chat-bee-panel" aria-label="Chat Ong NT">
          <header className="chat-bee-head">
            <div className="chat-bee-head-main">
              <BeeIcon className="chat-bee-avatar" />
              <div>
                <strong>Ong NT</strong>
                <span>Trợ lý NT shop</span>
              </div>
            </div>
            <button type="button" className="chat-bee-close" aria-label="Đóng chat" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <div className="chat-bee-messages" ref={listRef}>
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`chat-bee-bubble chat-bee-bubble-${item.role}`}
                style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
              >
                {item.content.split('\n').map((line, lineIndex) => (
                  <p key={lineIndex}>{line}</p>
                ))}
              </div>
            ))}
            {pending ? (
              <p className="chat-bee-typing" aria-live="polite">
                Ong đang nghĩ
                <span className="chat-bee-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            ) : null}
            {error ? <p className="chat-bee-error">{error}</p> : null}
          </div>

          <form className="chat-bee-form" onSubmit={onSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Hỏi Ong NT…"
              maxLength={500}
              aria-label="Tin nhắn"
              disabled={pending}
            />
            <button type="submit" className="btn btn-primary" disabled={pending || !input.trim()}>
              Gửi
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-bee-fab"
        aria-label={open ? 'Đóng chat Ong NT' : 'Mở chat Ong NT'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <BeeIcon className="chat-bee-fab-icon" />
      </button>
    </div>
  );
}
