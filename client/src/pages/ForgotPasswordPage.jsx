import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { HiOutlineMail, HiOutlineLockClosed, HiCheckCircle } from "react-icons/hi";
import { Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("request"); // request | reset | done
  const [email, setEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  const newPassword = watch("newPassword");

  const requestOtp = async (data) => {
    setServerError("");
    try {
      const message = await forgotPassword(data.email);
      setEmail(data.email);
      setInfo(message);
      setStep("reset");
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const submitReset = async (data) => {
    setServerError("");
    try {
      await resetPassword({ email, otp: data.otp, newPassword: data.newPassword });
      setStep("done");
    } catch (err) {
      setServerError(getErrorMessage(err, "That code is invalid or expired. Please request a new one."));
    }
  };

  if (step === "done") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <HiCheckCircle className="h-14 w-14 text-[var(--color-transit)]" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--color-ink)]">Password reset</h1>
        <p className="mt-2 text-sm text-[var(--color-line)]">You can now log in with your new password.</p>
        <Button className="mt-6 w-full" onClick={() => navigate("/login")}>Go to login</Button>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Check your email</h1>
        <p className="mt-2 text-sm text-[var(--color-line)]">{info || `Enter the code we sent to ${email}, along with a new password.`}</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(submitReset)}>
          <Field label="6-digit code" required error={errors.otp?.message}>
            <input inputMode="numeric" maxLength={6} className={inputClass(errors.otp)} placeholder="123456" {...register("otp", { required: "Enter the code", minLength: { value: 6, message: "Code must be 6 digits" }, maxLength: { value: 6, message: "Code must be 6 digits" } })} />
          </Field>

          <Field label="New password" required error={errors.newPassword?.message}>
            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
              <input type="password" className={`${inputClass(errors.newPassword)} pl-10`} placeholder="At least 8 characters" {...register("newPassword", { required: "Create a new password", minLength: { value: 8, message: "At least 8 characters" } })} />
            </div>
          </Field>

          <Field label="Confirm new password" required error={errors.confirmPassword?.message}>
            <div className="relative">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
              <input type="password" className={`${inputClass(errors.confirmPassword)} pl-10`} placeholder="Repeat password" {...register("confirmPassword", { required: "Confirm your password", validate: (v) => v === newPassword || "Passwords don't match" })} />
            </div>
          </Field>

          {serverError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{serverError}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Forgot your password?</h1>
      <p className="mt-2 text-sm text-[var(--color-line)]">Enter your email and we'll send you a reset code.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(requestOtp)}>
        <Field label="Email" required error={errors.email?.message}>
          <div className="relative">
            <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input className={`${inputClass(errors.email)} pl-10`} placeholder="you@example.com" {...register("email", { required: "Enter your email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />
          </div>
        </Field>

        {serverError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{serverError}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset code"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-line)]">
        Remembered it? <Link to="/login" className="font-semibold text-[var(--color-route)]">Log in</Link>
      </p>
    </div>
  );
}
