"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, ExternalLink, FileText, ImagePlus, Loader2, Pencil, Plus, Save, Store, Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Notice, type NoticeState } from "@/components/Notice";
import { useLang } from "@/components/LanguageProvider";
import { postJson } from "@/lib/client-api";
import { format } from "@/lib/i18n";
import type { Brand, BranchSummary } from "@/lib/types";

interface Draft {
  name: string;
  slug: string;
  instagram: string;
  description: string;
  accent: string;
}

const EMPTY: Draft = {
  name: "",
  slug: "",
  instagram: "",
  description: "",
  accent: "#F24B3F",
};

export function BrandManager({
  brands,
  branches,
  canCreate,
  editableIds,
}: {
  brands: Brand[];
  branches: BranchSummary[];
  canCreate: boolean;
  editableIds: number[];
}) {
  const router = useRouter();
  const { t } = useLang();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [stamp, setStamp] = useState(0);
  const [uploading, setUploading] = useState<string | null>(null);

  const canEdit = (id: number) => editableIds.includes(id);

  function show(message: string, tone: NoticeState["tone"]) {
    setNotice({ message, tone });
  }

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setFormOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setDraft({
      name: brand.name,
      slug: brand.slug,
      instagram: brand.instagram ?? "",
      description: brand.description ?? "",
      accent: brand.accent,
    });
    setFormOpen(true);
  }

  function save() {
    startTransition(async () => {
      const result = await postJson(
        "/api/owner/action",
        editing ? { type: "brandUpdate", brandId: editing.id, ...draft } : { type: "brandCreate", ...draft },
      );
      if (result.message) show(result.message, result.ok ? "success" : "error");
      if (result.ok) {
        setFormOpen(false);
        setEditing(null);
        router.refresh();
      }
    });
  }

  function upload(brandId: number, kind: "logo" | "menu", file: File | null) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      show(t.owner.uploadTooLarge, "error");
      return;
    }
    const key = `${brandId}-${kind}`;
    setUploading(key);
    startTransition(async () => {
      const body = new FormData();
      body.set("brandId", String(brandId));
      body.set("kind", kind);
      body.set("file", file);
      try {
        const response = await fetch("/api/owner/brand/asset", { method: "POST", body });
        let result: { ok: boolean; message?: string } = {
          ok: false,
          message: response.status === 413 ? t.owner.uploadTooLarge : t.owner.uploadFailed,
        };
        try {
          result = (await response.json()) as { ok: boolean; message?: string };
        } catch {
          // A non-JSON response is usually a platform body-size error.
        }
        show(result.message ?? (result.ok ? t.owner.saved : t.owner.uploadFailed), result.ok ? "success" : "error");
        if (result.ok) {
          setStamp(Date.now());
          router.refresh();
        }
      } catch {
        show(t.owner.uploadFailed, "error");
      } finally {
        setUploading(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-tomato">{t.owner.brandsKicker}</p>
          <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-none tracking-tight">{t.owner.brandsTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-muted">{t.owner.brandsSub}</p>
        </div>
        {canCreate && (
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus className="size-3.5" /> {t.owner.addBrand}
          </button>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {brands.map((brand) => {
          const brandBranches = branches.filter((branch) => branch.brandId === brand.id);
          const logoStamp = stamp ? `?v=${stamp}` : "";
          return (
            <section key={brand.id} className="card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                {brand.hasLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/brands/${brand.id}/logo${logoStamp}`}
                    alt={`${brand.name} logo`}
                    className="h-16 w-28 shrink-0 rounded-2xl border-2 border-ink bg-white object-contain p-1"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-cream">
                    <Store className="size-6 text-tomato" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl leading-tight">{brand.name}</h2>
                    <span className="pill status-muted">/{brand.slug}</span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    {brandBranches.length} {t.owner.branches.toLowerCase()} · {brand.accent}
                  </p>
                  {brand.instagram && (
                    <a
                      href={`https://instagram.com/${brand.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-tomato hover:underline"
                    >
                      <AtSign className="size-3" /> {brand.instagram}
                    </a>
                  )}
                </div>
              </div>

              {brand.description && <p className="mt-3 text-sm font-medium leading-relaxed text-muted">{brand.description}</p>}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link href={`/b/${brand.slug}`} className="btn btn-ghost btn-sm text-muted" target="_blank">
                  <ExternalLink className="size-3.5" /> {t.owner.openBrand}
                </Link>
                {brand.hasMenu && (
                  <a href={`/api/brands/${brand.id}/menu`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm text-muted">
                    <FileText className="size-3.5" /> {brand.menuFilename ?? t.owner.menuPdf}
                  </a>
                )}
                {canEdit(brand.id) && (
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => openEdit(brand)}>
                    <Pencil className="size-3.5" /> {t.common.edit}
                  </button>
                )}
              </div>

              {canEdit(brand.id) && (
                <div className="mt-4 grid gap-2 rounded-xl border-2 border-dashed border-ink/25 bg-cream/50 p-3 sm:grid-cols-2">
                  <label className="btn btn-soft btn-sm cursor-pointer justify-center">
                    {uploading === `${brand.id}-logo` ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
                    {t.owner.uploadLogo}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(event) => {
                        upload(brand.id, "logo", event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <label className="btn btn-soft btn-sm cursor-pointer justify-center">
                    {uploading === `${brand.id}-menu` ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                    {t.owner.uploadMenu}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        upload(brand.id, "menu", event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? format(t.owner.editBrandTitle, { name: editing.name }) : t.owner.addBrand}
        description={t.owner.brandFormDesc}
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
              <label className="label" htmlFor="brand-name">{t.owner.brandName}</label>
              <input
                id="brand-name"
                className="input"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="brand-slug">{t.owner.brandSlug}</label>
              <input
                id="brand-slug"
                className="input"
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                maxLength={60}
                placeholder="nikumaru"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="brand-instagram">{t.owner.instagram}</label>
              <input
                id="brand-instagram"
                className="input"
                value={draft.instagram}
                onChange={(event) => setDraft({ ...draft, instagram: event.target.value })}
                maxLength={60}
                placeholder="@nikumaru.id"
              />
            </div>
            <div>
              <label className="label" htmlFor="brand-accent">{t.owner.accent}</label>
              <input
                id="brand-accent"
                type="color"
                className="h-11 w-full cursor-pointer rounded-xl border-2 border-ink bg-white p-1"
                value={draft.accent}
                onChange={(event) => setDraft({ ...draft, accent: event.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="brand-description">{t.owner.brandDescription}</label>
            <textarea
              id="brand-description"
              className="input min-h-24 resize-y"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
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
