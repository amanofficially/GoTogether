import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { dashboardPathFor } from "../components/layout/PublicOnlyRoute";
import { getErrorMessage } from "../lib/api";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState("");
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If login fails because the email was never verified, we switch into an
  // OTP step right here instead of dead-ending the user with just an error
  // message and no way to actually verify (see authController.js -> login,
  // which tags this specific case with code 'EMAIL_NOT_VERIFIED').
  const [step, setStep] = useState("login"); // "login" | "otp"
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const loggedInUser = await login(data);
      navigate(location.state?.from?.pathname || dashboardPathFor(loggedInUser), { replace: true });
    } catch (err) {
      if (err?.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        setPendingEmail(data.email);
        setStep("otp");
        // Send a fresh code proactively — the one from signup may have
        // already expired by the time the person comes back to log in.
        resendOtp(data.email).catch(() => {});
        return;
      }
      setServerError(getErrorMessage(err, "Couldn't log in. Check your credentials and try again."));
    }
  };

  const otpValue = otp.join("");

  const handleOtpChange = (i) => (e) => {
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
      const loggedInUser = await verifyOtp({ email: pendingEmail, otp: otpValue });
      navigate(location.state?.from?.pathname || dashboardPathFor(loggedInUser), { replace: true });
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
      await resendOtp(pendingEmail);
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
        <p className="mt-2 text-sm text-[var(--color-line)]">
          Your account isn't verified yet. Enter the 6-digit code sent to {pendingEmail} to finish logging in.
        </p>
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
            {verifying ? "Verifying…" : "Verify & log in"}
          </Button>
          <p className="text-center text-sm text-[var(--color-line)]">
            Didn't get it?{" "}
            <button type="button" disabled={resending} onClick={resend} className="font-semibold text-[var(--color-route)] disabled:opacity-60">
              {resending ? "Sending…" : "Resend code"}
            </button>
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("login");
              setServerError("");
              setOtp(["", "", "", "", "", ""]);
            }}
            className="block w-full text-center text-sm text-[var(--color-line)] underline"
          >
            Back to log in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-semibold text-[var(--color-ink)]">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--color-line)]">Log in to find your next shared ride.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Email" required error={errors.email?.message}>
          <div className="relative">
            <HiOutlineMail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input className={`${inputClass(errors.email)} pl-10`} placeholder="you@example.com" {...register("email", { required: "Enter your email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } })} />
          </div>
        </Field>

        <Field label="Password" required error={errors.password?.message}>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--color-line)]" />
            <input
              type={showPw ? "text" : "password"}
              className={`${inputClass(errors.password)} pl-10 pr-10`}
              placeholder="••••••••"
              {...register("password", { required: "Enter your password", minLength: { value: 6, message: "At least 6 characters" } })}
            />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-line)]">
              {showPw ? <HiOutlineEyeOff className="h-4.5 w-4.5" /> : <HiOutlineEye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-[var(--color-line)]">
            <input type="checkbox" className="rounded border-[var(--color-line)]/40 accent-[var(--color-route)]" /> Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-[var(--color-route)]">Forgot password?</Link>
        </div>

        {serverError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{serverError}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-[var(--color-line)]">
        New to GoTogether? <Link to="/signup" className="font-semibold text-[var(--color-route)]">Create an account</Link>
      </p>
    </div>
  );
}
