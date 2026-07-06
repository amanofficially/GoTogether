import { useState } from "react";
import { HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineAdjustments, HiOutlineSearch } from "react-icons/hi";
import RideCard from "../components/ride/RideCard";
import { EmptyState, Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { searchRides } from "../services/rideService";
import { geocodeAddress } from "../lib/geocode";
import { getErrorMessage } from "../lib/api";

export default function SearchRidePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("earliest");
  const [maxPrice, setMaxPrice] = useState(200);

  const [results, setResults] = useState(null); // null = no search yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      let origin;
      let destination;
      if (from.trim()) {
        const geo = await geocodeAddress(from);
        if (!geo) throw new Error(`Couldn't find "${from}". Try a more specific address.`);
        origin = geo;
      }
      if (to.trim()) {
        const geo = await geocodeAddress(to);
        if (!geo) throw new Error(`Couldn't find "${to}". Try a more specific address.`);
        destination = geo;
      }

      const rides = await searchRides({ origin, destination, date: date || undefined });
      setResults(rides);
      setHasSearched(true);
    } catch (err) {
      setError(err.response ? getErrorMessage(err) : err.message || "Something went wrong while searching.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setDate("");
    setMaxPrice(200);
  };

  const filtered = (results || [])
    .filter((r) => r.price <= maxPrice)
    .sort((a, b) => (sort === "cheapest" ? a.price - b.price : a.time.localeCompare(b.time)));

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Find a ride</h1>
      <p className="mt-1 text-[var(--color-line)]">Search by route to match with commuters already heading your way.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <form onSubmit={runSearch} className="h-fit rounded-2xl border border-[var(--color-line)]/10 bg-white p-5">
          <p className="mb-4 flex items-center gap-2 font-mono-tag text-xs uppercase text-[var(--color-line)]">
            <HiOutlineAdjustments className="h-4 w-4" /> Filters
          </p>
          <div className="space-y-4">
            <Field label="From">
              <div className="relative">
                <HiOutlineLocationMarker className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-transit)]" />
                <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Arera Colony, Bhopal" className={`${inputClass(false)} pl-10`} />
              </div>
            </Field>
            <Field label="To">
              <div className="relative">
                <HiOutlineLocationMarker className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-route)]" />
                <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. DB City Mall, Bhopal" className={`${inputClass(false)} pl-10`} />
              </div>
            </Field>
            <Field label="Date">
              <div className="relative">
                <HiOutlineCalendar className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass(false)} pl-10`} />
              </div>
            </Field>
            <Field label={`Max fare — ₹${maxPrice}`}>
              <input type="range" min="20" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--color-route)]" />
            </Field>
            <Field label="Sort by">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass(false)}>
                <option value="earliest">Earliest departure</option>
                <option value="cheapest">Cheapest first</option>
              </select>
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              <HiOutlineSearch className="h-4 w-4" /> {loading ? "Searching…" : "Search rides"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        </form>

        <div>
          {error && <p className="mb-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

          {!hasSearched && !loading ? (
            <EmptyState
              icon={<HiOutlineSearch className="mx-auto text-[var(--color-line)]" />}
              title="Search for a ride"
              body="Enter a pickup and drop location (or just a date) and hit search to see matching rides."
            />
          ) : loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-[var(--color-line)]">{filtered.length} ride{filtered.length !== 1 ? "s" : ""} found</p>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={<HiOutlineSearch className="mx-auto text-[var(--color-line)]" />}
                  title="No rides match those filters"
                  body="Try widening your fare range or clearing the date filter — new rides are posted throughout the day."
                  action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {filtered.map((ride) => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
