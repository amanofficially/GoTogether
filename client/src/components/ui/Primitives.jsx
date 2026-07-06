export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-line)]/10 bg-white ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-[var(--color-paper-dim)] text-[var(--color-line)]",
  transit: "bg-[var(--color-transit-dim)] text-[var(--color-transit)]",
  route: "bg-[var(--color-route)]/12 text-[var(--color-route)]",
  alert: "bg-[var(--color-alert)]/10 text-[var(--color-alert)]",
  ink: "bg-[var(--color-ink)] text-[var(--color-paper)]",
};

export function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium font-mono-tag ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Field({ label, error, hint, children, required }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
          {label} {required && <span className="text-[var(--color-route)]">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-[var(--color-line)]">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-[var(--color-alert)]">{error}</span>}
    </label>
  );
}

export function inputClass(hasError) {
  return `w-full rounded-xl border ${hasError ? "border-[var(--color-alert)]" : "border-[var(--color-line)]/25"} bg-white px-4 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-line)]/60 outline-none transition-colors focus:border-[var(--color-route)]`;
}

export function StatCard({ label, value, sub, tone = "ink" }) {
  return (
    <Card className="p-5">
      <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${tone === "route" ? "text-[var(--color-route)]" : tone === "transit" ? "text-[var(--color-transit)]" : "text-[var(--color-ink)]"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-[var(--color-line)]">{sub}</p>}
    </Card>
  );
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-line)]/25 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-[var(--color-line)]">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
