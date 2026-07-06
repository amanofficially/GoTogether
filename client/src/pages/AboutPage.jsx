import { Badge, Card } from "../components/ui/Primitives";
import RouteLine from "../components/ui/RouteLine";

const timeline = [
  { label: "The commute problem", sub: "Single-occupancy cars fill Bhopal's roads at the same two hours, every weekday." },
  { label: "The idea", sub: "Match people already driving the same route instead of adding more cars to it." },
  { label: "The build", sub: "A verified, ratings-backed platform for daily riders — not one-off taxi trips." },
  { label: "Today", sub: "12,400+ commuters sharing rides across 6 cities, saving fuel and time together." },
];

const values = [
  { title: "Safety first", body: "OTP verification, licence checks for drivers, and two-way ratings on every ride." },
  { title: "Built for routine", body: "Designed around the same commute, same time, same people — not random one-off trips." },
  { title: "Fair by default", body: "Cost-splitting, not profiteering. Drivers recover fuel cost; passengers pay a fair share." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <Badge tone="route">About GoTogether</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--color-ink)] sm:text-5xl">
        Built for the commute you make every day.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-[var(--color-line)]">
        GoTogether started with a simple observation: most cars on the road during rush hour carry one person, driving a route someone
        else nearby is driving too. We built a platform to close that gap.
      </p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="font-mono-tag text-xs uppercase text-[var(--color-route)]">Our path</p>
          <div className="mt-4">
            <RouteLine orientation="vertical" stops={timeline} />
          </div>
        </div>
        <div>
          <p className="font-mono-tag text-xs uppercase text-[var(--color-route)]">What we stand for</p>
          <div className="mt-4 grid gap-4">
            {values.map((v) => (
              <Card key={v.title} className="p-5">
                <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">{v.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-line)]">{v.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 rounded-2xl bg-[var(--color-ink)] p-8 text-[var(--color-paper)] sm:p-12">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-route)]">Where we're headed</p>
        <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">From a portfolio build to a real commuting network.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-mist)]">
          Live location tracking, in-app payments, and driver verification are already on our roadmap — GoTogether is designed to
          scale from a class project into infrastructure daily commuters can rely on.
        </p>
      </div>
    </div>
  );
}
