// Basic UI pieces used everywhere: buttons, headings, labels, tags, form fields and notices.
import { useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

const variants = {
  primary: 'bg-ink text-paper border-ink [--wipe:var(--accent)] hover:text-on-accent',
  outline: 'border-rule text-ink [--wipe:var(--ink)] hover:text-paper hover:border-ink',
  accent: 'bg-accent text-on-accent border-accent [--wipe:var(--ink)] hover:text-paper hover:border-ink',
  inverse: 'bg-on-inverse text-inverse border-on-inverse [--wipe:var(--accent)] hover:text-on-accent',
};

/** Pill button with a bottom-up fill wipe and a gentle magnetic pull on mouse devices. */
export function Button({
  to,
  href,
  variant = 'primary',
  icon: Icon = ArrowRight,
  children,
  className = '',
  cursor,
  ...rest
}) {
  const ref = useRef(null);
  const move = (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.2}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
  };
  const leave = () => ref.current && (ref.current.style.translate = '');
  const cls = `group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full border px-6 py-3.5 text-[0.95rem] font-medium transition-[color,border-color,translate] duration-500 ease-ui disabled:pointer-events-none disabled:!border-rule disabled:!bg-stone disabled:!text-muted ${variants[variant]} ${className}`;
  const inner = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full rounded-full bg-[var(--wipe)] transition-transform duration-500 ease-ui group-hover:translate-y-0"
      />
      <span className="relative">{children}</span>
      {Icon && (
        <Icon
          aria-hidden
          className="relative size-4 transition-transform duration-500 ease-ui group-hover:translate-x-1"
        />
      )}
    </>
  );
  const props = {
    ref,
    className: cls,
    onPointerMove: move,
    onPointerLeave: leave,
    'data-cursor': cursor,
    ...rest,
  };
  if (to)
    return (
      <Link to={to} {...props}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a href={href} {...props}>
        {inner}
      </a>
    );
  return (
    <button type={rest.type ?? 'button'} {...props}>
      {inner}
    </button>
  );
}

/** Heading split into masked lines. Pass an array; a line can contain JSX (e.g. <Hl>). */
export function Lines({ as: Tag = 'h2', lines, className = '', hero }) {
  return (
    <Tag className={className} {...(hero ? { 'data-hero': '' } : { 'data-lines': '' })}>
      {lines.map((l, i) => (
        <span className="line" key={i}>
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}

export const Hl = ({ children }) => <span className="hl">{children}</span>;

export function Label({ n, children, className = '' }) {
  return (
    <p className={`eyebrow ${className}`}>
      <span className="text-ink [.inverse_&]:text-on-inverse">{String(n).padStart(2, '0')}</span> / {children}
    </p>
  );
}

/** `01 / Label` → big heading (8 cols) → short intro aligned right (4 cols). */
export function SectionHeader({ n, label, lines, intro, inverse }) {
  return (
    <div className="grid gap-8 md:grid-cols-12 md:items-end">
      <div className="md:col-span-8">
        <Label n={n}>{label}</Label>
        <Lines lines={lines} className="h-section mt-6" />
      </div>
      {intro && (
        <p
          data-reveal
          className={`md:col-span-4 max-w-sm text-[1.02rem] leading-relaxed ${inverse ? 'text-inverse-muted' : 'text-muted'}`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

export const Tag = ({ children, className = '' }) => (
  <span className={`inline-block rounded-full border border-rule px-3 py-1 text-xs ${className}`}>
    {children}
  </span>
);

export function StatusBadge({ status }) {
  const now = status === 'Now' || status === 'Done';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${now ? 'border-accent bg-accent text-on-accent' : 'border-rule text-muted'}`}
    >
      {status}
    </span>
  );
}

export function Field({ label, required, hint, error, id, children, ...input }) {
  const fid = id || input.name;
  return (
    <div>
      <label htmlFor={fid} className="mb-2 block text-sm font-medium">
        {label}{' '}
        {required ? (
          <span className="font-normal text-muted">(required)</span>
        ) : (
          <span className="font-normal text-muted">(optional)</span>
        )}
      </label>
      {children ?? (
        <input
          id={fid}
          required={required}
          className="input"
          aria-invalid={error ? true : undefined}
          {...input}
        />
      )}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-ink">{error}</p>}
    </div>
  );
}

export function Notice({ kind = 'info', children }) {
  const err = kind === 'error';
  return (
    <div
      role={err ? 'alert' : 'status'}
      className={`flex gap-3 rounded-[14px] border p-4 text-sm leading-relaxed ${err ? 'border-ink' : 'border-rule'}`}
    >
      <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${err ? 'bg-ink' : 'bg-accent'}`} />
      <div>
        <strong className="font-medium">{err ? 'Error: ' : 'Note: '}</strong>
        {children}
      </div>
    </div>
  );
}
