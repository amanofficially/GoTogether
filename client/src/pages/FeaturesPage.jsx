import {
  HiOutlineSearch, HiOutlineChatAlt2, HiOutlineLocationMarker, HiOutlineShieldCheck,
  HiOutlineStar, HiOutlineBell, HiOutlineCreditCard, HiOutlineExclamationCircle,
} from "react-icons/hi";
import { Badge, Card } from "../components/ui/Primitives";

const core = [
  { icon: HiOutlineSearch, title: "Smart route matching", body: "Search by route, not just city — matches account for actual overlap and detour distance." },
  { icon: HiOutlineLocationMarker, title: "Live pickup points", body: "Set waypoints along your commute so passengers join without you leaving your route." },
  { icon: HiOutlineChatAlt2, title: "In-app chat", body: "Coordinate pickup details directly with your driver or passenger, no number sharing required." },
  { icon: HiOutlineStar, title: "Ratings & reviews", body: "Two-way ratings after every ride build a trustworthy, accountable commuting community." },
];

const advanced = [
  { icon: HiOutlineShieldCheck, title: "Driver verification", body: "Licence and vehicle document checks before a driver can list a ride." },
  { icon: HiOutlineBell, title: "Push notifications", body: "Booking requests, ride reminders, and confirmations delivered instantly." },
  { icon: HiOutlineCreditCard, title: "Wallet & payments", body: "In-app wallet for cashless fare splitting — coming with Phase 6." },
  { icon: HiOutlineExclamationCircle, title: "Emergency SOS", body: "One-tap alert with live location shared to emergency contacts during a ride." },
];

function FeatureGrid({ items }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((f) => (
        <Card key={f.title} className="p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-route)]/12">
            <f.icon className="h-5.5 w-5.5 text-[var(--color-route)]" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-[var(--color-ink)]">{f.title}</h3>
          <p className="mt-1.5 text-sm text-[var(--color-line)]">{f.body}</p>
        </Card>
      ))}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <Badge tone="route">Features</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--color-ink)] sm:text-5xl">Everything a daily commute needs.</h1>
      <p className="mt-5 max-w-2xl text-lg text-[var(--color-line)]">
        From finding your first ride to tracking a driver in real time — GoTogether is built around the routine of commuting, not
        one-off trips.
      </p>

      <div className="mt-14">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Core · Available now</p>
        <div className="mt-4">
          <FeatureGrid items={core} />
        </div>
      </div>

      <div className="mt-14">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Advanced · Rolling out</p>
        <div className="mt-4">
          <FeatureGrid items={advanced} />
        </div>
      </div>
    </div>
  );
}
