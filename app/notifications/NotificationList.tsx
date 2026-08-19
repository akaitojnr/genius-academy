"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const typeIcon: Record<string, string> = {
  ANNOUNCEMENT: "📢",
  PAYMENT_SUCCESS: "💳",
  NEW_LESSON: "📘",
  LIVE_CLASS: "🎥",
  ASSIGNMENT: "📝",
  EXAM: "🧪",
};

export default function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  async function markRead(id: string) {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    router.refresh();
  }

  async function markAllRead() {
    setLoading(true);
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mt-6">
      {unreadCount > 0 && (
        <button
          onClick={markAllRead}
          disabled={loading}
          className="mb-4 text-sm font-medium text-brand-700 hover:underline disabled:opacity-60"
        >
          Mark all as read ({unreadCount})
        </button>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`block w-full rounded-xl border p-4 text-left text-sm ${
              n.isRead ? "border-slate-200 bg-white" : "border-brand-200 bg-brand-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {typeIcon[n.type] ?? "🔔"} {n.title}
              </p>
              {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
            </div>
            <p className="mt-1 text-slate-600">{n.message}</p>
            <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
          </button>
        ))}

        {notifications.length === 0 && <p className="text-sm text-slate-500">No notifications yet.</p>}
      </div>
    </div>
  );
}
