"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { TablePill } from "@/components/Pills";
import { postJson } from "@/lib/client-api";
import type { DiningTable } from "@/lib/types";

interface Draft {
  label: string;
  capacity: number;
  zone: string;
}

const EMPTY: Draft = { label: "", capacity: 2, zone: "Main dining" };

export function TablesManager({ tables }: { tables: DiningTable[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<DiningTable | null>(null);
  const [deleting, setDeleting] = useState<DiningTable | null>(null);

  const zones = useMemo(() => {
    const map = new Map<string, DiningTable[]>();
    for (const table of tables) {
      const list = map.get(table.zone) ?? [];
      list.push(table);
      map.set(table.zone, list);
    }
    return [...map.entries()];
  }, [tables]);

  const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0);
  const available = tables.filter((table) => table.status === "available").length;

  function show(message: string, tone: NoticeState["tone"]) {
    setNotice({ message, tone });
  }

  function run(action: () => Promise<{ ok: boolean; message?: string }>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.message) show(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        onSuccess?.();
        router.refresh();
      }
    });
  }

  const existingZones = [...new Set(tables.map((table) => table.zone))];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-clay">Floor plan</p>
          <h1 className="mt-1 font-display text-[2.3rem] leading-none tracking-tight">Tables</h1>
          <p className="mt-2 text-sm text-muted">
            {tables.length} tables · {totalSeats} seats · {available} open right now
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setDraft({ ...EMPTY, zone: existingZones[0] ?? "Main dining" });
            setCreateOpen(true);
          }}
        >
          <Plus className="size-3.5" /> Add table
        </button>
      </header>

      <div className="space-y-5">
        {zones.map(([zone, zoneTables]) => (
          <section key={zone} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
              <div>
                <h2 className="font-display text-xl leading-tight">{zone}</h2>
                <p className="text-xs text-muted">
                  {zoneTables.length} tables · {zoneTables.reduce((sum, table) => sum + table.capacity, 0)} seats
                </p>
              </div>
              <span className="pill status-muted">
                {zoneTables.filter((table) => table.status === "available").length} open
              </span>
            </div>
            <div className="divide-y divide-line/70">
              {zoneTables.map((table) => (
                <div key={table.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-sm font-extrabold text-paper">
                    {table.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {table.capacity} {table.capacity === 1 ? "seat" : "seats"}
                    </p>
                    <p className="text-xs text-muted">{table.zone}</p>
                  </div>
                  <TablePill status={table.status} />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      aria-label={`Edit ${table.label}`}
                      onClick={() => setEditing(table)}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon text-muted hover:text-clay-dark"
                      aria-label={`Delete ${table.label}`}
                      onClick={() => setDeleting(table)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-cream/40 p-4 text-xs leading-relaxed text-muted">
        Tables are the physical seats your host can assign. Capacity is a hard limit: the board will never
        seat a party larger than the table. Changes apply immediately at the host stand.
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add a table"
        description="Use the name your team already says out loud — T9, Patio 2, Bar 1."
      >
        <TableForm
          draft={draft}
          setDraft={setDraft}
          zones={existingZones}
          pending={pending}
          submitLabel="Add table"
          onSubmit={() =>
            run(
              () => postJson("/api/owner/action", { type: "tableCreate", ...draft }),
              () => {
                setCreateOpen(false);
                setDraft(EMPTY);
              },
            )
          }
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.label}` : "Edit table"}
        description="Changing capacity on a seated table is blocked if the party wouldn't fit."
      >
        {editing && (
          <TableForm
            draft={{ label: editing.label, capacity: editing.capacity, zone: editing.zone }}
            setDraft={(next) => setEditing({ ...editing, ...next })}
            zones={existingZones}
            pending={pending}
            submitLabel="Save changes"
            onSubmit={() =>
              run(
                () =>
                  postJson("/api/owner/action", {
                    type: "tableUpdate",
                    id: editing.id,
                    label: editing.label,
                    capacity: editing.capacity,
                    zone: editing.zone,
                  }),
                () => setEditing(null),
              )
            }
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this table?"
        description="Removing a table is permanent. Seated tables must be cleared first."
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>
              Keep table
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() => {
                const table = deleting;
                setDeleting(null);
                if (table) run(() => postJson("/api/owner/action", { type: "tableDelete", id: table.id }));
              }}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Remove
            </button>
          </>
        }
      >
        {deleting && (
          <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <span className="font-bold">{deleting.label}</span> · {deleting.capacity} seats · {deleting.zone}
          </div>
        )}
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function TableForm({
  draft,
  setDraft,
  zones,
  pending,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  zones: string[];
  pending: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="table-label">Table name</label>
          <input
            id="table-label"
            className="input"
            value={draft.label}
            onChange={(event) => setDraft({ ...draft, label: event.target.value.toUpperCase() })}
            placeholder="T9"
            maxLength={16}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="table-capacity">Seats</label>
          <input
            id="table-capacity"
            type="number"
            min={1}
            max={40}
            className="input num"
            value={draft.capacity}
            onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="table-zone">Zone</label>
        <input
          id="table-zone"
          className="input"
          list="zones"
          value={draft.zone}
          onChange={(event) => setDraft({ ...draft, zone: event.target.value })}
          placeholder="Main dining"
          maxLength={40}
          required
        />
        <datalist id="zones">
          {zones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" className="btn btn-ghost flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
