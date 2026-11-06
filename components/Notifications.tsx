"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import {
  askNotificationPermission,
  notificationPermission,
  registerNotificationWorker,
  type NotificationPermissionState,
} from "@/lib/notify";

export function NotificationPrompt({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const current = notificationPermission();
    setPermission(current);
    if (current === "granted") void registerNotificationWorker();
  }, []);

  if (permission === "unsupported" || permission === "granted") return null;

  if (permission === "denied") {
    return (
      <span
        className={
          compact
            ? "inline-flex size-8 items-center justify-center rounded-full border-2 border-ink/20 text-muted-soft"
            : "inline-flex items-center gap-1.5 rounded-xl border-2 border-ink/20 px-2.5 py-1.5 text-[0.6875rem] font-semibold text-muted"
        }
        title={t.common.notificationsBlocked}
        aria-label={t.common.notificationsBlocked}
      >
        <BellOff className="size-3.5" />
        {!compact && t.common.notificationsBlocked}
      </span>
    );
  }

  async function request() {
    setBusy(true);
    const next = await askNotificationPermission();
    setPermission(next);
    setBusy(false);
  }

  return (
    <button
      type="button"
      className={compact ? "btn btn-soft btn-icon" : "btn btn-soft btn-sm"}
      onClick={request}
      disabled={busy}
      title={t.common.enableNotifications}
      aria-label={t.common.enableNotifications}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
      {!compact && <span>{t.common.enableNotifications}</span>}
    </button>
  );
}
