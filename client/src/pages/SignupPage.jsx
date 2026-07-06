import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone } from "react-icons/hi";
import { Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/api";

export default function SignupPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [step, setStep] = useState("form"); // form | otp
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pendingData, setPendingData] = useState(null);
  const [serverError, setServerError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const { register: doRegister, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const password = watch("password");

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await doRegister(data);
      setPendingData(data);
      setStep("otp");
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't create your account. Please try again."));
    }
  };

  const otpValue = otp.join("");

  const handleOtpChange = (i, raw) => (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && e.target.nextElementSibling) e.target.nextElementSibling.focus();
  };

  const verify = async (e) => {
    e.preventDefault();
    setServerError("");
    setVerifying(true);
    try {
      await verifyOtp({ email: pendingData.email, otp: otpValue });
      const destination = pendingData.role === "driver" ? "/offer-ride" : "/dashboard/passenger";
      navigate(destination, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, "That code didn't work. Please check it and try again."));
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResendMessage("");
    setServerError("");
    setResending(true);
    try {
      await resendOtp(pendingData.email);
      setResendMessage("A new code has been sent.");
    } catch (err) {
      setServerError(getErrorMessage(err, "Couldn't resend the code. Please wait and try again."));
    } finally {
      setResending(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Verify your email</h1>
        <p className="mt-2 text-sm text-[var(--color-line)]">Enter the 6-digit code sent to {pendingData?.email}.</p>
        <form className="mt-8 space-y-6" onSubmit={verify}>
          <div className="flex justify-between gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                value={digit}
                onChange={handleOtpChange(i)}
                maxLength={1}
                inputMode="numeric"
                className="h-14 w-11 rounded-xl border border-[var(--color-line)]/25 text-center font-display text-xl outline-none focus:border-[var(--color-route)]"
              />
            ))}
          </div>

          {serverError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{serverError}</p>}
          {resendMessage && <p className="text-center text-sm text-[var(--color-transit)]">{resendMessage}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={otpValue.length !== 6 || verifying}>
            {verifying ? "Verifying…" : "Verify & create account"}
          </Button>
          <p className="text-center text-sm text-[var(--color-line)]">
            Didn't get it?{" "}
            <button type="button" disabled={resending} onClick={resend} className="font-semibold text-[var(--color-route)] disabled:opacity-60">
              {resending ? "Sending…" : "Resend code"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Create your account</h1>
      <p className="mt-2 text-sm text-[var(--color-line)]">Join commuters already sharing their daily route.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Full name" required error={errors.name?.message}>
          <div className="relative">
            <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input className={`${inputClass(errors.name)} pl-10`} placeholder="Ananya Sharma" {...register("name", { required: "Enter your name", minLength: { value: 2, message: "At least 2 characters" }, maxLength: { value: 50, message: "At most 50 characters" } })} />
          </div>
        </Field>

        <Field label="Email" required error={errors.email?.message}>
          <div className="relative">
            <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input className={`${inputClass(errors.email)} pl-10`} placeholder="you@example.com" {...register("email", { required: "Enter your email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />
          </div>
        </Field>

        <Field label="Phone number" required error={errors.phone?.message} hint="Include country code, e.g. +91XXXXXXXXXX">
          <div className="relative">
            <HiOutlinePhone className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input className={`${inputClass(errors.phone)} pl-10`} placeholder="+91 98765 43210" {...register("phone", { required: "Enter your phone number", pattern: { value: /^\+?[0-9]{10,15}$/, message: "Enter a valid phone number" } })} />
          </div>
        </Field>

        <Field label="Password" required error={errors.password?.message}>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input type="password" className={`${inputClass(errors.password)} pl-10`} placeholder="At least 8 characters" {...register("password", { required: "Create a password", minLength: { value: 8, message: "At least 8 characters" }, pattern: { value: /\d/, message: "Must contain a number" } })} />
          </div>
        </Field>

        <Field label="Confirm password" required error={errors.confirmPassword?.message}>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input type="password" className={`${inputClass(errors.confirmPassword)} pl-10`} placeholder="Repeat password" {...register("confirmPassword", { required: "Confirm your password", validate: (v) => v === password || "Passwords don't match" })} />
          </div>
        </Field>

        <Field label="I'll primarily be a…">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--color-line)]/25 py-2.5 text-sm font-medium has-[:checked]:border-[var(--color-route)] has-[:checked]:bg-[var(--color-route)]/10 has-[:checked]:text-[var(--color-route)]">
              <input type="radio" value="passenger" defaultChecked className="hidden" {...register("role")} /> Passenger
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--color-line)]/25 py-2.5 text-sm font-medium has-[:checked]:border-[var(--color-route)] has-[:checked]:bg-[var(--color-route)]/10 has-[:checked]:text-[var(--color-route)]">
              <input type="radio" value="driver" className="hidden" {...register("role")} /> Driver
            </label>
          </div>
        </Field>

        <label className="flex items-start gap-2 text-xs text-[var(--color-line)]">
          <input type="checkbox" required className="mt-0.5 rounded border-[var(--color-line)]/40 accent-[var(--color-route)]" />
          I agree to GoTogether's Terms of Service and Privacy Policy.
        </label>

        {serverError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{serverError}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Continue"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-line)]">
        Already have an account? <Link to="/login" className="font-semibold text-[var(--color-route)]">Log in</Link>
      </p>
    </div>
  );
}
