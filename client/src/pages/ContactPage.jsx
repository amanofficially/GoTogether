import { useState } from "react";
import { useForm } from "react-hook-form";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiCheckCircle } from "react-icons/hi";
import { Badge, Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    // Simulated API call — replace with axios POST /api/contact
    await new Promise((r) => setTimeout(r, 700));
    setSent(true);
    reset();
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <Badge tone="route">Contact</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-[var(--color-ink)] sm:text-5xl">Talk to the GoTogether team.</h1>
      <p className="mt-5 max-w-xl text-lg text-[var(--color-line)]">
        Questions about a ride, a report, or partnering with us on a campus or office rollout — we read every message.
      </p>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <HiOutlineMail className="mt-0.5 h-5 w-5 text-[var(--color-route)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Email</p>
              <p className="text-sm text-[var(--color-line)]">support@gotogether.app</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HiOutlinePhone className="mt-0.5 h-5 w-5 text-[var(--color-route)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Phone</p>
              <p className="text-sm text-[var(--color-line)]">+91 90000 12345 (Mon–Sat, 9am–7pm)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HiOutlineLocationMarker className="mt-0.5 h-5 w-5 text-[var(--color-route)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Office</p>
              <p className="text-sm text-[var(--color-line)]">Arera Colony, Bhopal, Madhya Pradesh</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)]/10 bg-white p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <HiCheckCircle className="h-10 w-10 text-[var(--color-transit)]" />
              <h3 className="mt-3 font-display text-lg font-semibold text-[var(--color-ink)]">Message sent</h3>
              <p className="mt-1 text-sm text-[var(--color-line)]">We'll get back to you within one business day.</p>
              <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>Send another message</Button>
            </div>
          ) : (
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <Field label="Full name" required error={errors.name?.message}>
                <input className={inputClass(errors.name)} placeholder="Ananya Sharma" {...register("name", { required: "Enter your name" })} />
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <input className={inputClass(errors.email)} placeholder="you@example.com" {...register("email", { required: "Enter your email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Subject" required error={errors.subject?.message}>
                  <input className={inputClass(errors.subject)} placeholder="Ride issue, partnership, feedback…" {...register("subject", { required: "Add a subject" })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Message" required error={errors.message?.message}>
                  <textarea rows={5} className={inputClass(errors.message)} placeholder="Tell us more…" {...register("message", { required: "Add a message" })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send message"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
