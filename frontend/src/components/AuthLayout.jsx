export default function AuthLayout({ kicker, title, lead, aside, children }) {
  return (
    <section className="auth">
      <aside className="auth-aside">
        <div className="auth-aside-copy">
          <p className="brand-hero light">NT shop</p>
          <h2>{aside.title}</h2>
          <p>{aside.text}</p>
        </div>
      </aside>
      <div className="auth-card">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        {children}
      </div>
    </section>
  );
}
