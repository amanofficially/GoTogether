import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineCurrencyRupee,
  HiArrowRight,
  HiBadgeCheck,
} from "react-icons/hi";
import Button from "../components/ui/Button";
import { Card, Badge } from "../components/ui/Primitives";
import RouteLine from "../components/ui/RouteLine";
import { rides } from "../data/rides";

const stats = [
  { label: "Daily commuters", value: "12,400+" },
  { label: "Avg. saved / month", value: "₹2,150" },
  { label: "CO₂ avoided", value: "38 t / mo" },
  { label: "Cities live", value: "6" },
];

const steps = [
  {
    stop: "Arera Colony",
    title: "Post or search your route",
    body: "Tell us where you start and where you're headed — office, campus, station.",
  },
  {
    stop: "Bittan Market",
    title: "Match with a commuter nearby",
    body: "We line up drivers and passengers already going your way, same time, same road.",
  },
  {
    stop: "New Market",
    title: "Confirm seats & chat",
    body: "Book your seat or approve a request, then coordinate pickup in-app.",
  },
  {
    stop: "DB City Mall",
    title: "Ride, rate, repeat",
    body: "Travel together, split the cost, and build a trusted commuting circle.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:items-center lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge tone="route">GT-2026 · Bhopal → 6 cities</Badge>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--color-ink)] sm:text-6xl">
              Share the route.
              <br />
              Split the cost.
            </h1>
            <p className="mt-5 max-w-md text-base text-[var(--color-line)] sm:text-lg">
              GoTogether connects commuters already driving your way — office
              employees, students, daily riders — so no seat travels empty.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/search-ride" size="lg">
                Find a ride <HiArrowRight className="h-4 w-4" />
              </Button>
              <Button as={Link} to="/offer-ride" variant="outline" size="lg">
                Offer a ride
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {rides.slice(0, 3).map((r) => (
                  <img
                    key={r.id}
                    src={r.driver.avatar}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-[var(--color-paper)] object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--color-line)]">
                <span className="font-semibold text-[var(--color-ink)]">
                  4.8★ average
                </span>{" "}
                across 12,400 riders
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="p-6 shadow-lg">
              <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">
                Today's route · 08:15 AM
              </p>
              <div className="mt-4">
                <RouteLine
                  orientation="vertical"
                  stops={[
                    { label: "Arera Colony", sub: "Pickup · 08:15 AM" },
                    { label: "Bittan Market", sub: "Waypoint" },
                    { label: "New Market", sub: "Waypoint" },
                    { label: "DB City Mall", sub: "Drop · 08:37 AM" },
                  ]}
                />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--color-paper-dim)] p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={rides[0].driver.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="flex items-center gap-1 text-sm font-semibold text-[var(--color-ink)]">
                      {rides[0].driver.name}{" "}
                      <HiBadgeCheck className="h-4 w-4 text-[var(--color-transit)]" />
                    </p>
                    <p className="text-xs text-[var(--color-line)]">
                      {rides[0].vehicle}
                    </p>
                  </div>
                </div>
                <p className="font-display text-lg font-semibold text-[var(--color-ink)]">
                  ₹{rides[0].price}
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--color-line)]/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-10 sm:px-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-[var(--color-line)] sm:text-sm">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — real sequence, so the route-line/stop framing is earned */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-xl">
          <p className="font-mono-tag text-xs uppercase text-[var(--color-route)]">
            How it works
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl">
            Four stops from empty seat to shared ride
          </h2>
        </div>
        <div className="mt-10">
          <RouteLine
            orientation="horizontal"
            stops={steps.map((s) => ({ label: s.stop }))}
            className="mb-8 hidden md:flex"
          />
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.stop}>
                <p className="font-mono-tag text-xs text-[var(--color-route)]">
                  {s.stop}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-[var(--color-ink)]">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-[var(--color-line)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo video */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono-tag text-xs uppercase tracking-[0.25em] text-[var(--color-route)]">
            See it in action
          </p>

          <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl lg:text-5xl">
            60 Seconds on GoTogether
          </h2>

          <p className="mt-4 text-lg text-[var(--color-line)]">
            Watch how commuters post rides, find route matches, book seats, and
            travel together—all in under a minute.
          </p>
        </div>

        <div className="mt-12 mx-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-black shadow-2xl shadow-orange-500/10 ring-1 ring-[var(--color-paper)]/10">
          <video
            className="w-full aspect-video object-cover"
            src="/video.mp4"
            poster="/video-poster.jpg"
            controls
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
          >
            Your browser doesn't support embedded video.
          </video>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-[var(--color-ink)] py-20 text-[var(--color-paper)]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: HiOutlineCurrencyRupee,
                title: "Cut commute costs",
                body: "Split fuel and toll costs with people already going your way — most riders save over ₹2,000 a month.",
              },
              {
                icon: HiOutlineShieldCheck,
                title: "Verified community",
                body: "Licence checks, OTP-verified accounts, and two-way ratings keep every ride accountable.",
              },
              {
                icon: HiOutlineSearch,
                title: "Smart route matching",
                body: "We match on actual overlap in your route, not just city — so pickups stay a short walk away.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--color-paper)]/12 p-6"
              >
                <f.icon className="h-7 w-7 text-[var(--color-route)]" />
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-mist)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8">
        <h2 className="font-display text-3xl font-semibold text-[var(--color-ink)] sm:text-4xl">
          Your seat is waiting on someone's route.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[var(--color-line)]">
          Join commuters already sharing rides across Bhopal and five other
          cities.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button as={Link} to="/signup" size="lg">
            Create your free account
          </Button>
          <Button as={Link} to="/search-ride" variant="outline" size="lg">
            Browse rides first
          </Button>
        </div>
      </section>
    </div>
  );
}
