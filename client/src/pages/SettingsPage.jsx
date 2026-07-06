import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { changePassword, deleteAccount } from "../services/userService";
import { getErrorMessage } from "../lib/api";

export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const pwForm = useForm();
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const newPassword = pwForm.watch("newPassword");

  const submitPassword = async (data) => {
    setPwError("");
    setPwSuccess("");
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setPwSuccess("Password updated. You'll stay signed in on this device.");
      pwForm.reset();
    } catch (err) {
      setPwError(getErrorMessage(err, "Couldn't update your password."));
    } finally {
      setPwSaving(false);
    }
  };

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const submitDelete = async (e) => {
    e.preventDefault();
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAccount({ password: deletePassword });
      await logout();
      navigate("/");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete your account. Check your password and try again."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Settings</h1>
      <p className="mt-1 text-sm text-[var(--color-line)]">Manage your account security.</p>

      <Card className="mt-6 p-6">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Change password</p>
        <form className="mt-4 grid gap-5 sm:grid-cols-2" onSubmit={pwForm.handleSubmit(submitPassword)}>
          <div className="sm:col-span-2">
            <Field label="Current password" required error={pwForm.formState.errors.currentPassword?.message}>
              <input type="password" className={inputClass(pwForm.formState.errors.currentPassword)} {...pwForm.register("currentPassword", { required: "Required" })} />
            </Field>
          </div>
          <Field label="New password" required error={pwForm.formState.errors.newPassword?.message}>
            <input type="password" className={inputClass(pwForm.formState.errors.newPassword)} {...pwForm.register("newPassword", { required: "Required", minLength: { value: 8, message: "At least 8 characters" }, pattern: { value: /\d/, message: "Must contain a number" } })} />
          </Field>
          <Field label="Confirm new password" required error={pwForm.formState.errors.confirmPassword?.message}>
            <input type="password" className={inputClass(pwForm.formState.errors.confirmPassword)} {...pwForm.register("confirmPassword", { required: "Required", validate: (v) => v === newPassword || "Passwords don't match" })} />
          </Field>

          {pwError && <p className="sm:col-span-2 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{pwError}</p>}
          {pwSuccess && <p className="sm:col-span-2 rounded-lg bg-[var(--color-transit-dim)] px-3 py-2 text-sm text-[var(--color-transit)]">{pwSuccess}</p>}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pwSaving}>{pwSaving ? "Updating…" : "Update password"}</Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5 border-[var(--color-alert)]/30 p-6">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-alert)]">Danger zone</p>
        <p className="mt-2 text-sm text-[var(--color-line)]">Deleting your account permanently removes your profile and vehicles. This can't be undone.</p>

        {!showDelete ? (
          <Button variant="outline" className="mt-4 border-[var(--color-alert)] text-[var(--color-alert)] hover:bg-[var(--color-alert)]/10" onClick={() => setShowDelete(true)}>
            Delete my account
          </Button>
        ) : (
          <form onSubmit={submitDelete} className="mt-4 space-y-3">
            <Field label="Confirm your password" required>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className={inputClass(false)} />
            </Field>
            {deleteError && <p className="rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{deleteError}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={deleting || !deletePassword} className="bg-[var(--color-alert)] hover:opacity-90">
                {deleting ? "Deleting…" : "Permanently delete account"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
