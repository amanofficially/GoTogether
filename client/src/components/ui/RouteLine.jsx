/**
 * RouteLine — the signature element of GoTogether's visual language.
 * A dashed road line connecting waypoint pins, used to encode real
 * sequence (a route, a set of stops) rather than decorative numbering.
 */
export default function RouteLine({ stops = [], orientation = "horizontal", className = "" }) {
  if (orientation === "vertical") {
    return (
      <div className={`relative flex flex-col ${className}`}>
        <div
          className="absolute left-[7px] top-2 bottom-2 border-l-[3px] border-dashed"
          style={{ borderColor: "var(--color-line)", opacity: 0.5 }}
          aria-hidden="true"
        />
        {stops.map((stop, i) => (
          <div key={i} className="relative flex items-start gap-4 py-2.5">
            <span
              className="relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-4 ring-[var(--color-paper)]"
              style={{ background: i === 0 ? "var(--color-transit)" : i === stops.length - 1 ? "var(--color-route)" : "var(--color-mist)" }}
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">{stop.label}</p>
              {stop.sub && <p className="text-xs text-[var(--color-line)]">{stop.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center ${className}`} aria-hidden="true">
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed"
        style={{ borderColor: "var(--color-line)", opacity: 0.4 }}
      />
      <div className="relative z-10 flex w-full justify-between">
        {stops.map((stop, i) => (
          <span
            key={i}
            className="h-3.5 w-3.5 rounded-full ring-4 ring-[var(--color-paper)]"
            style={{ background: i === 0 ? "var(--color-transit)" : i === stops.length - 1 ? "var(--color-route)" : "var(--color-mist)" }}
            title={stop.label}
          />
        ))}
      </div>
    </div>
  );
}
