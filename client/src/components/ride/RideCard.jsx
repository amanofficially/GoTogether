import { Link } from "react-router-dom";
import { HiOutlineClock, HiOutlineUserGroup, HiBadgeCheck } from "react-icons/hi";
import { Card, Badge } from "../ui/Primitives";
import Button from "../ui/Button";
import RouteLine from "../ui/RouteLine";

export default function RideCard({ ride }) {
  const seatsLeft = ride.seatsAvailable;
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={ride.driver.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
          <div>
            <p className="flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
              {ride.driver.name}
              {ride.driver.verified && <HiBadgeCheck className="h-4 w-4 text-[var(--color-transit)]" title="Verified driver" />}
            </p>
            <p className="text-xs text-[var(--color-line)]">★ {ride.driver.rating} · {ride.vehicle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold text-[var(--color-ink)]">₹{ride.price}</p>
          <p className="text-xs text-[var(--color-line)]">per seat</p>
        </div>
      </div>

      <div className="mt-5">
        <RouteLine
          orientation="vertical"
          stops={[
            { label: ride.from, sub: `${ride.time} · departure` },
            { label: ride.to, sub: `≈ ${ride.durationMin} min · ${ride.distanceKm} km` },
          ]}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="neutral"><HiOutlineClock className="h-3.5 w-3.5" /> {ride.date}</Badge>
        <Badge tone={seatsLeft > 0 ? "transit" : "alert"}>
          <HiOutlineUserGroup className="h-3.5 w-3.5" /> {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft > 1 ? "s" : ""} left` : "Full"}
        </Badge>
        {ride.preferences?.slice(0, 2).map((p) => (
          <Badge key={p} tone="neutral">{p}</Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-line)]/10 pt-4">
        <span className="font-mono-tag text-xs text-[var(--color-line)]">{ride.id}</span>
        <Button as={Link} to={`/ride/${ride.id}`} size="sm">View details</Button>
      </div>
    </Card>
  );
}
