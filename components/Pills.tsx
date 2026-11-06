"use client";

import { useLang } from "@/components/LanguageProvider";
import type { EntryStatus, TableStatus } from "@/lib/types";

const entryStyles: Record<EntryStatus, string> = {
  waiting: "status-waiting",
  called: "status-called",
  seated: "status-seated",
  completed: "status-muted",
  no_show: "status-noshow",
  cancelled: "status-muted",
};

const tableStyles: Record<TableStatus, string> = {
  available: "status-seated",
  seated: "status-called",
  dirty: "status-waiting",
  blocked: "status-muted",
};

export function EntryPill({ status }: { status: EntryStatus }) {
  const { t } = useLang();
  const labels: Record<EntryStatus, string> = {
    waiting: t.status.waiting,
    called: t.status.called,
    seated: t.status.seated,
    completed: t.status.completed,
    no_show: t.status.noShow,
    cancelled: t.status.cancelled,
  };
  return <span className={`pill ${entryStyles[status] ?? entryStyles.waiting}`}>{labels[status] ?? t.status.waiting}</span>;
}

export function TablePill({ status }: { status: TableStatus }) {
  const { t } = useLang();
  const labels: Record<TableStatus, string> = {
    available: t.status.available,
    seated: t.status.seated,
    dirty: t.status.dirty,
    blocked: t.status.blocked,
  };
  return <span className={`pill ${tableStyles[status] ?? tableStyles.available}`}>{labels[status] ?? t.status.available}</span>;
}
