import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { HiOutlineLocationMarker, HiCheckCircle, HiOutlinePlus } from "react-icons/hi";
import { Field, inputClass, Badge } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { getMyVehicles, addVehicle } from "../services/userService";
import { createRide } from "../services/rideService";
import { geocodeAddress } from "../lib/geocode";
import { getErrorMessage } from "../lib/api";

export default function OfferRidePage() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { seats: 3, price: 50, instantBooking: true },
  });
  const [posted, setPosted] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState(null); // null = loading
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  const vehicleForm = useForm();

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyVehicles()
      .then((vs) => {
        setVehicles(vs);
        if (vs.length > 0) setSelectedVehicle(vs[0]._id);
        else setShowAddVehicle(true);
      })
      .catch(() => setVehicles([]));
  }, [isAuthenticated]);

  const submitVehicle = async (data) => {
    setVehicleError("");
    setAddingVehicle(true);
    try {
      const vehicle = await addVehicle({ ...data, seats: Number(data.seats) });
      setVehicles((cur) => [...(cur || []), vehicle]);
      setSelectedVehicle(vehicle._id);
      setShowAddVehicle(false);
      vehicleForm.reset();
    } catch (err) {
      setVehicleError(getErrorMessage(err, "Couldn't add that vehicle."));
    } finally {
      setAddingVehicle(false);
    }
  };

  const onSubmit = async (data) => {
    setServerError("");
    if (!selectedVehicle) {
      setServerError("Add and select a vehicle before posting a ride.");
      return;
    }
    try {
      const [originGeo, destinationGeo] = await Promise.all([geocodeAddress(data.from), geocodeAddress(data.to)]);
      if (!originGeo) throw new Error(`Couldn't find "${data.from}". Try a more specific address.`);
      if (!destinationGeo) throw new Error(`Couldn't find "${data.to}". Try a more specific address.`);

      const departureTime = new Date(`${data.date}T${data.time}`).toISOString();

      await createRide({
        vehicle: selectedVehicle,
        origin: { address: data.from, lat: originGeo.lat, lng: originGeo.lng },
        destination: { address: data.to, lat: destinationGeo.lat, lng: destinationGeo.lng },
        departureTime,
        totalSeats: Number(data.seats),
        pricePerSeat: Number(data.price),
        preferences: {
          smokingAllowed: !!data.smokingAllowed,
          petsAllowed: !!data.petsAllowed,
          womenOnly: !!data.womenOnly,
          instantBooking: !!data.instantBooking,
        },
      });
      setPosted(true);
    } catch (err) {
      setServerError(err.response ? getErrorMessage(err) : err.message || "Couldn't post this ride.");
    }
  };

  if (initializing) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Log in to offer a ride</h1>
        <p className="mt-2 text-sm text-[var(--color-line)]">Create an account or log in to post your route and start giving rides.</p>
        <div className="mt-6 flex gap-3">
          <Button as={Link} to="/login" state={{ from: location }}>Log in</Button>
          <Button as={Link} to="/signup" variant="outline">Sign up</Button>
        </div>
      </div>
    );
  }

  if (posted) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
        <HiCheckCircle className="h-14 w-14 text-[var(--color-transit)]" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-ink)]">Your ride is live</h1>
        <p className="mt-2 text-sm text-[var(--color-line)]">Passengers heading your way can now find and request a seat.</p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate("/dashboard/driver")}>Go to driver dashboard</Button>
          <Button variant="outline" onClick={() => setPosted(false)}>Offer another ride</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <Badge tone="transit">For drivers</Badge>
      <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--color-ink)]">Offer a ride</h1>
      <p className="mt-1 text-[var(--color-line)]">Post your daily route once — matching passengers can request a seat any time before departure.</p>

      <div className="mt-8 rounded-2xl border border-[var(--color-line)]/10 bg-white p-6 sm:p-8">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Your vehicle</p>

        {vehicles === null ? (
          <p className="mt-3 text-sm text-[var(--color-line)]">Loading your vehicles…</p>
        ) : (
          <>
            {vehicles.length > 0 && !showAddVehicle && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className={`${inputClass(false)} max-w-xs`}>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.make} {v.model} · {v.color} · {v.plateNumber}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddVehicle(true)}>
                  <HiOutlinePlus className="h-4 w-4" /> Add another
                </Button>
              </div>
            )}

            {showAddVehicle && (
              <form onSubmit={vehicleForm.handleSubmit(submitVehicle)} className="mt-4 grid gap-3 rounded-xl bg-[var(--color-paper-dim)] p-4 sm:grid-cols-2">
                <Field label="Make" required error={vehicleForm.formState.errors.make?.message}>
                  <input className={inputClass(vehicleForm.formState.errors.make)} placeholder="Hyundai" {...vehicleForm.register("make", { required: "Required" })} />
                </Field>
                <Field label="Model" required error={vehicleForm.formState.errors.model?.message}>
                  <input className={inputClass(vehicleForm.formState.errors.model)} placeholder="i20" {...vehicleForm.register("model", { required: "Required" })} />
                </Field>
                <Field label="Color" required error={vehicleForm.formState.errors.color?.message}>
                  <input className={inputClass(vehicleForm.formState.errors.color)} placeholder="White" {...vehicleForm.register("color", { required: "Required" })} />
                </Field>
                <Field label="Plate number" required error={vehicleForm.formState.errors.plateNumber?.message}>
                  <input className={inputClass(vehicleForm.formState.errors.plateNumber)} placeholder="MP 04 AB 7231" {...vehicleForm.register("plateNumber", { required: "Required" })} />
                </Field>
                <Field label="Seats" required error={vehicleForm.formState.errors.seats?.message}>
                  <input type="number" min={1} max={8} className={inputClass(vehicleForm.formState.errors.seats)} {...vehicleForm.register("seats", { required: true, min: 1, max: 8 })} />
                </Field>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm" disabled={addingVehicle}>{addingVehicle ? "Adding…" : "Save vehicle"}</Button>
                  {vehicles.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddVehicle(false)}>Cancel</Button>
                  )}
                </div>
                {vehicleError && <p className="sm:col-span-2 text-xs text-[var(--color-alert)]">{vehicleError}</p>}
              </form>
            )}
          </>
        )}
      </div>

      <form className="mt-6 space-y-6 rounded-2xl border border-[var(--color-line)]/10 bg-white p-6 sm:p-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Pickup location" required error={errors.from?.message}>
            <div className="relative">
              <HiOutlineLocationMarker className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-transit)]" />
              <input className={`${inputClass(errors.from)} pl-10`} placeholder="e.g. Arera Colony, Bhopal" {...register("from", { required: "Enter a pickup point" })} />
            </div>
          </Field>
          <Field label="Drop location" required error={errors.to?.message}>
            <div className="relative">
              <HiOutlineLocationMarker className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-route)]" />
              <input className={`${inputClass(errors.to)} pl-10`} placeholder="e.g. DB City Mall, Bhopal" {...register("to", { required: "Enter a drop point" })} />
            </div>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Date" required error={errors.date?.message}>
            <input type="date" className={inputClass(errors.date)} {...register("date", { required: "Pick a date" })} />
          </Field>
          <Field label="Departure time" required error={errors.time?.message}>
            <input type="time" className={inputClass(errors.time)} {...register("time", { required: "Pick a time" })} />
          </Field>
          <Field label="Seats available" required error={errors.seats?.message}>
            <input type="number" min={1} max={8} className={inputClass(errors.seats)} {...register("seats", { required: true, min: 1, max: 8 })} />
          </Field>
        </div>

        <Field label="Price per seat (₹)" required error={errors.price?.message}>
          <input type="number" min={1} className={inputClass(errors.price)} {...register("price", { required: true, min: 1 })} />
        </Field>

        <Field label="Ride preferences">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-line)]/25 px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-route)] has-[:checked]:bg-[var(--color-route)]/10">
              <input type="checkbox" {...register("smokingAllowed")} /> Smoking OK
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-line)]/25 px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-route)] has-[:checked]:bg-[var(--color-route)]/10">
              <input type="checkbox" {...register("petsAllowed")} /> Pets OK
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-line)]/25 px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-route)] has-[:checked]:bg-[var(--color-route)]/10">
              <input type="checkbox" {...register("womenOnly")} /> Ladies only
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-line)]/25 px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-route)] has-[:checked]:bg-[var(--color-route)]/10">
              <input type="checkbox" defaultChecked {...register("instantBooking")} /> Instant booking
            </label>
          </div>
        </Field>

        {serverError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{serverError}</p>}

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Posting ride…" : "Post this ride"}
        </Button>
      </form>
    </div>
  );
}
