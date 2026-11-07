"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, X } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import {
  askNotificationPermission,
  notificationPermission,
  registerNotificationWorker,
  type NotificationPermissionState,
} from "@/lib/notify";

export function NotificationPrompt({
  compact = false,
  variant = "button",
}: {
  compact?: boolean;
  variant?: "button" | "banner";
}) {
  const { t } = useLang();
  const [permission, setPermission] = useState<NotificationPermissionState>("unsupported");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const current = notificationPermission();
    setPermission(current);
    if (current === "granted") void registerNotificationWorker();
  }, []);

  if (permission === "unsupported" || permission === "granted" || dismissed) return null;

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

  if (variant === "banner") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-ink bg-butter px-3.5 py-2.5 shadow-[2px_2px_0_#262321]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white text-tomato">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold">{t.common.notificationBannerTitle}</p>
          <p className="text-[0.6875rem] font-semibold text-ink/60">{t.common.notificationBannerBody}</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={request} disabled={busy}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />}
          {t.common.enableNotifications}
        </button>
        <button
          type="button"
          className="rounded-full p-1 text-ink/40 hover:text-ink"
          onClick={() => setDismissed(true)}
          aria-label={t.common.close}
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
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
