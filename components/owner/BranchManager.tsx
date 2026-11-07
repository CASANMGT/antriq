"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Building2, Clock3, ExternalLink, Loader2, MapPin, Pencil, Plus, Save, Settings } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import type { BranchSummary } from "@/lib/types";

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Bangkok",
  "Asia/Manila",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
];

interface Draft {
  brandId: string;
  name: string;
  slug: string;
  tagline: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  timezone: string;
  openTime: string;
  closeTime: string;
  accent: string;
  announcement: string;
}

const EMPTY: Draft = {
  brandId: "",
  name: "",
  slug: "",
  tagline: "",
  address: "",
  phone: "",
  latitude: "",
  longitude: "",
  timezone: "Asia/Jakarta",
  openTime: "11:00",
  closeTime: "23:30",
  accent: "#F24B3F",
  announcement: "",
};

export function BranchManager({
  branches,
  brands,
  canCreate,
  editableIds,
}: {
  branches: BranchSummary[];
  brands: { id: number; name: string }[];
  canCreate: boolean;
  editableIds: number[];
}) {
  const router = useRouter();
  const { t } = useLang();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchSummary | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  function show(message: string, tone: NoticeState["tone"]) {
    setNotice({ message, tone });
  }

  function openCreate() {
    setEditing(null);
    setDraft({ ...EMPTY, brandId: String(brands[0]?.id ?? "") });
    setFormOpen(true);
  }

  function openEdit(branch: BranchSummary) {
    setEditing(branch);
    setDraft({
      brandId: String(branch.brandId),
      name: branch.name,
      slug: branch.slug,
      tagline: branch.tagline ?? "",
      address: branch.address ?? "",
      phone: branch.phone ?? "",
      latitude: branch.latitude == null ? "" : String(branch.latitude),
      longitude: branch.longitude == null ? "" : String(branch.longitude),
      timezone: branch.timezone,
      openTime: branch.openTime,
      closeTime: branch.closeTime,
      accent: branch.accent,
      announcement: branch.announcement ?? "",
    });
    setFormOpen(true);
  }

  function save() {
    startTransition(async () => {
      const result = await postJson(
        "/api/owner/action",
        editing
          ? { type: "branchUpdate", branchId: editing.id, ...draft }
          : { type: "branchCreate", ...draft },
      );
      if (result.message) show(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setFormOpen(false);
        setEditing(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-tomato">{t.owner.branchesKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.branchesTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-muted">{t.owner.branchesSub}</p>
        </div>
        {canCreate && (
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus className="size-3.5" /> {t.owner.addBranch}
          </button>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {branches.map((branch) => (
          <section key={branch.id} className="card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-cream">
                <Building2 className="size-5 text-tomato" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl leading-tight">{branch.name}</h2>
                  <span
                    className={`pill ${
                      branch.waitlistStatus === "open"
                        ? "status-seated"
                        : branch.waitlistStatus === "paused"
                          ? "status-waiting"
                          : "status-muted"
                    }`}
                  >
                    {branch.waitlistStatus === "open"
                      ? t.owner.waitlistOpen
                      : branch.waitlistStatus === "paused"
                        ? t.owner.waitlistPaused
                        : t.owner.waitlistClosed}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  {branch.brandName} · /{branch.slug}
                </p>
                {branch.address && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-muted">
                    <MapPin className="mt-0.5 size-3 shrink-0 text-tomato" /> {branch.address}
                  </p>
                )}
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Clock3 className="size-3 text-tomato" /> {branch.timezone}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Link href={`/b/${branch.brandSlug}/${branch.slug}`} target="_blank" className="btn btn-ghost btn-sm text-muted">
                <ExternalLink className="size-3.5" /> {t.owner.openBranch}
              </Link>
              <Link href={`/dashboard/settings?branch=${branch.id}`} className="btn btn-ghost btn-sm text-muted">
                <Settings className="size-3.5" /> {t.owner.settings}
              </Link>
              <Link href={`/dashboard?branch=${branch.id}`} className="btn btn-ghost btn-sm text-muted">
                {t.owner.overview} <ArrowUpRight className="size-3.5" />
              </Link>
              {editableIds.includes(branch.id) && (
                <button type="button" className="btn btn-soft btn-sm" onClick={() => openEdit(branch)}>
                  <Pencil className="size-3.5" /> {t.common.edit}
                </button>
              )}
            </div>
          </section>
        ))}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? format(t.owner.editBranchTitle, { name: editing.name }) : t.owner.addBranch}
        description={t.owner.branchFormDesc}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="branch-brand">{t.owner.brand}</label>
              <select
                id="branch-brand"
                className="input bg-white"
                value={draft.brandId}
                onChange={(event) => setDraft({ ...draft, brandId: event.target.value })}
                disabled={Boolean(editing)}
                required
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="branch-name">{t.owner.branchName}</label>
              <input
                id="branch-name"
                className="input"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-slug">{t.owner.branchSlug}</label>
              <input
                id="branch-slug"
                className="input"
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                maxLength={60}
                placeholder="senopati"
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-tagline">{t.owner.tagline}</label>
              <input
                id="branch-tagline"
                className="input"
                value={draft.tagline}
                onChange={(event) => setDraft({ ...draft, tagline: event.target.value })}
                maxLength={120}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="branch-address">{t.owner.address}</label>
              <input
                id="branch-address"
                className="input"
                value={draft.address}
                onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-latitude">{t.owner.latitude}</label>
              <input
                id="branch-latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                className="input num"
                value={draft.latitude}
                onChange={(event) => setDraft({ ...draft, latitude: event.target.value })}
                placeholder="-6.2423"
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-longitude">{t.owner.longitude}</label>
              <input
                id="branch-longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                className="input num"
                value={draft.longitude}
                onChange={(event) => setDraft({ ...draft, longitude: event.target.value })}
                placeholder="106.7997"
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-phone">{t.owner.phone}</label>
              <input
                id="branch-phone"
                className="input"
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                maxLength={40}
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-timezone">{t.owner.timezone}</label>
              <select
                id="branch-timezone"
                className="input bg-white"
                value={draft.timezone}
                onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="branch-open">{t.owner.opens}</label>
              <input
                id="branch-open"
                type="time"
                className="input num"
                value={draft.openTime}
                onChange={(event) => setDraft({ ...draft, openTime: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-close">{t.owner.closes}</label>
              <input
                id="branch-close"
                type="time"
                className="input num"
                value={draft.closeTime}
                onChange={(event) => setDraft({ ...draft, closeTime: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="branch-accent">{t.owner.accent}</label>
              <input
                id="branch-accent"
                type="color"
                className="h-11 w-full cursor-pointer rounded-xl border-2 border-ink bg-white p-1"
                value={draft.accent}
                onChange={(event) => setDraft({ ...draft, accent: event.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="branch-announcement">{t.owner.announcement}</label>
            <textarea
              id="branch-announcement"
              className="input min-h-20 resize-y"
              value={draft.announcement}
              onChange={(event) => setDraft({ ...draft, announcement: event.target.value })}
              maxLength={300}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => setFormOpen(false)}>
              {t.common.cancel}
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {t.common.save}
            </button>
          </div>
        </form>
      </Modal>

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
