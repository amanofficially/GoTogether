import { useEffect, useState } from "react";
import { HiOutlineClipboardCheck, HiOutlineTruck, HiOutlineChatAlt2, HiOutlineStar, HiOutlineCog, HiOutlineBell, HiOutlineShieldCheck } from "react-icons/hi";
import { Card, EmptyState } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import { useNotifications } from "../context/NotificationContext";
import { getErrorMessage } from "../lib/api";

const icons = {
  booking: HiOutlineClipboardCheck,
  ride: HiOutlineTruck,
  chat: HiOutlineChatAlt2,
  rating: HiOutlineStar,
  system: HiOutlineCog,
  admin: HiOutlineShieldCheck,
};

export default function NotificationsPage() {
  const { notifications: items, unreadCount, refresh, markAsRead, markAllAsRead } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((err) => setError(getErrorMessage(err, "Couldn't load notifications.")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const markOneRead = async (id) => {
    try {
      await markAsRead(id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--color-line)]">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>}
      </div>

      {error && <p className="mt-4 rounded-lg bg-[var(--color-alert)]/10 px-3 py-2 text-sm text-[var(--color-alert)]">{error}</p>}

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-route)] border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={<HiOutlineBell className="mx-auto text-[var(--color-line)]" />} title="You're all caught up" body="New booking requests and ride reminders will show up here." />
        ) : (
          items.map((n) => {
            const Icon = icons[n.type] || HiOutlineBell;
            return (
              <Card
                key={n._id}
                onClick={() => !n.isRead && markOneRead(n._id)}
                className={`flex cursor-pointer items-start gap-4 p-4 ${!n.isRead ? "border-l-4 border-l-[var(--color-route)]" : ""}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-paper-dim)]">
                  <Icon className="h-5 w-5 text-[var(--color-line)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">{n.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--color-line)]">{n.message}</p>
                  <p className="mt-1 text-xs text-[var(--color-line)]/70">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-route)]" />}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
