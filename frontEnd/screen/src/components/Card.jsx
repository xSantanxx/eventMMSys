function Card({ children, className = '', animate = false }) {
  return (
    <div
      className={`
        w-full rounded-2xl border border-border bg-surface shadow-sm
        ${animate ? 'animate-unfold overflow-hidden' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-border bg-accent-soft px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

function CardBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;

export default Card;
