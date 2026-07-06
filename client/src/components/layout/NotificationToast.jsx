import { Link } from "react-router-dom";
import { HiOutlineBell, HiX } from "react-icons/hi";
import { useNotifications } from "../../context/NotificationContext";

/** Slide-in toast for the notification pushed most recently over the socket. */
export default function NotificationToast() {
  const { toast, dismissToast } = useNotifications();

  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/10 bg-[var(--color-paper)] p-4 shadow-lg">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-route)]/10">
          <HiOutlineBell className="h-5 w-5 text-[var(--color-route)]" />
        </div>
        <Link to="/notifications" onClick={dismissToast} className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-ink)]">{toast.title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-[var(--color-line)]">{toast.message}</p>
        </Link>
        <button
          onClick={dismissToast}
          className="shrink-0 rounded-full p-1 text-[var(--color-line)] hover:bg-[var(--color-paper-dim)]"
          aria-label="Dismiss notification"
        >
          <HiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
