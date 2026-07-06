import { useRef, useState } from "react";
import { HiBadgeCheck, HiOutlineCamera, HiOutlinePencil } from "react-icons/hi";
import { useForm } from "react-hook-form";
import { Card, Badge, Field, inputClass } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { updateMe, uploadAvatar } from "../services/userService";
import { avatarUrl } from "../lib/normalize";
import { getErrorMessage } from "../lib/api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone },
  });

  const onSubmit = async (data) => {
    setError("");
    setSaving(true);
    try {
      const updated = await updateMe(data);
      setUser(updated);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update your profile."));
    } finally {
      setSaving(false);
    }
  };

  const onAvatarSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { avatar } = await uploadAvatar(file);
      setUser({ ...user, avatar });
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't upload that image."));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Profile</h1>

      {error && <p className="mt-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={avatarUrl(user)} alt="" className="h-20 w-20 rounded-full object-cover" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] disabled:opacity-60"
              >
                <HiOutlineCamera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} />
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-display text-xl font-semibold text-[var(--color-ink)]">
                {user?.name} {user?.isVerified && <HiBadgeCheck className="h-5 w-5 text-[var(--color-transit)]" />}
              </p>
              <p className="text-sm text-[var(--color-line)]">
                Member since {new Date(user?.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short" })} · ★ {(user?.ratingAverage ?? 0).toFixed(1)}
              </p>
            </div>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <HiOutlinePencil className="h-4 w-4" /> Edit profile
            </Button>
          )}
        </div>

        {editing ? (
          <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Field label="Full name" required error={errors.name?.message}>
              <input className={inputClass(errors.name)} {...register("name", { required: "Required", minLength: 2, maxLength: 50 })} />
            </Field>
            <Field label="Phone number" required error={errors.phone?.message}>
              <input className={inputClass(errors.phone)} {...register("phone", { required: "Required", pattern: { value: /^\+?[0-9]{10,15}$/, message: "Enter a valid phone number" } })} />
            </Field>
            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div><p className="text-[var(--color-line)]">Email</p><p className="font-medium text-[var(--color-ink)]">{user?.email}</p></div>
            <div><p className="text-[var(--color-line)]">Phone</p><p className="font-medium text-[var(--color-ink)]">{user?.phone}</p></div>
          </div>
        )}
      </Card>

      <Card className="mt-5 p-6">
        <p className="font-mono-tag text-xs uppercase text-[var(--color-line)]">Account status</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={user?.isVerified ? "transit" : "alert"}>{user?.isVerified ? "Email verified" : "Email not verified"}</Badge>
          <Badge tone="neutral">★ {(user?.ratingAverage ?? 0).toFixed(1)} ({user?.ratingCount ?? 0} ratings)</Badge>
        </div>
      </Card>
    </div>
  );
}
