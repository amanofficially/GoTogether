import { useState } from "react";
import { HiX, HiStar } from "react-icons/hi";
import Button from "../ui/Button";
import { Field, inputClass } from "../ui/Primitives";
import { createRating } from "../../services/ratingService";
import { getErrorMessage } from "../../lib/api";

/**
 * Rate & review modal, used once a ride is completed.
 *
 * @param {string} rideId
 * @param {string} toUserId - the person being rated (driver, or a passenger)
 * @param {string} toName
 * @param {string} [toAvatar]
 * @param {() => void} onClose
 * @param {(rating: object) => void} onSubmitted - called with the created rating
 */
export default function RatingModal({ rideId, toUserId, toName, toAvatar, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const created = await createRating({ rideId, toUserId, rating, review: review.trim() });
      onSubmitted?.(created);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't submit your review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Rate &amp; review</p>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--color-paper-dim)]">
            <HiX className="h-5 w-5 text-[var(--color-line)]" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <img
            src={toAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(toName || "?")}`}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
          <p className="text-sm text-[var(--color-line)]">
            How was your ride with <span className="font-semibold text-[var(--color-ink)]">{toName}</span>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <HiStar
                  className={`h-8 w-8 transition-colors ${
                    n <= (hoverRating || rating) ? "text-[var(--color-route)]" : "text-[var(--color-line)]/25"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="mt-5">
            <Field label="Your review" hint="Optional — help other riders know what to expect.">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Share a few words about your experience…"
                className={`${inputClass(false)} resize-none`}
              />
            </Field>
          </div>

          {error && <p className="mt-3 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-xs text-[var(--color-alert)]">{error}</p>}

          <div className="mt-5 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Not now
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
