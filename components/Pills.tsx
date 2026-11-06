import type { EntryStatus, TableStatus } from "@/lib/types";

const entryStyles: Record<EntryStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting", className: "status-waiting" },
  called: { label: "Table ready", className: "status-called" },
  seated: { label: "Seated", className: "status-seated" },
  completed: { label: "Completed", className: "status-muted" },
  no_show: { label: "No-show", className: "status-noshow" },
  cancelled: { label: "Cancelled", className: "status-muted" },
};

const tableStyles: Record<TableStatus, { label: string; className: string }> = {
  available: { label: "Open", className: "status-seated" },
  seated: { label: "Seated", className: "status-called" },
  dirty: { label: "Reset", className: "status-waiting" },
  blocked: { label: "Blocked", className: "status-muted" },
};

export function EntryPill({ status }: { status: EntryStatus }) {
  const meta = entryStyles[status] ?? entryStyles.waiting;
  return <span className={`pill ${meta.className}`}>{meta.label}</span>;
}

export function TablePill({ status }: { status: TableStatus }) {
  const meta = tableStyles[status] ?? tableStyles.available;
  return <span className={`pill ${meta.className}`}>{meta.label}</span>;
}
