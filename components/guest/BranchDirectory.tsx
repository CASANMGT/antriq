"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  AtSign,
  Clock3,
  FileText,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { distanceKm, formatDistance, type Coordinates } from "@/lib/distance";
import type { Brand, BranchSummary, PublicSnapshot } from "@/lib/types";

export interface DirectoryBrand {
  brand: Brand;
  branches: Array<{ branch: BranchSummary; snapshot: PublicSnapshot | null }>;
}

type LocationState = "idle" | "locating" | "ready" | "denied" | "unsupported" | "error";

export function BranchDirectory({ brands }: { brands: DirectoryBrand[] }) {
  const { t } = useLang();
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");

  function requestLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }
    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationState("ready");
      },
      (error) => {
        setLocationState(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  }

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }
    if (!navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (!cancelled && permission.state === "granted") requestLocation();
      })
      .catch(() => {
        // Permissions API unavailable; wait for the visitor to tap the button.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    return brands
      .map((entry) => {
        const branches = entry.branches.map((item) => {
          const { latitude, longitude } = item.branch;
          const distance =
            coords && latitude !== null && longitude !== null
              ? distanceKm(coords, { lat: latitude, lng: longitude })
              : null;
          return { ...item, distance };
        });
        branches.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
        return { brand: entry.brand, branches, nearest: branches[0]?.distance ?? Number.POSITIVE_INFINITY };
      })
      .sort((a, b) => a.nearest - b.nearest);
  }, [brands, coords]);

  const locationTitle =
    locationState === "ready"
      ? t.picker.nearMeOn
      : locationState === "denied"
        ? t.picker.locationDeniedTitle
        : locationState === "unsupported"
          ? t.picker.locationUnsupportedTitle
          : t.picker.nearMeTitle;
  const locationBody =
    locationState === "ready"
      ? t.picker.sortingNearest
      : locationState === "locating"
        ? t.picker.locating
        : locationState === "denied"
          ? t.picker.locationDeniedBody
          : locationState === "unsupported"
            ? t.picker.locationUnsupportedBody
            : locationState === "error"
              ? t.picker.locationError
              : t.picker.nearMeBody;

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white px-4 py-3.5 shadow-[3px_3px_0_#262321]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-pink text-tomato-dark">
            <Navigation className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">{locationTitle}</p>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-muted">{locationBody}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          disabled={locationState === "locating"}
          className="btn btn-primary btn-sm shrink-0"
        >
          {locationState === "locating" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LocateFixed className="size-3.5" />
          )}
          {locationState === "ready" ? t.picker.updateLocation : t.picker.useLocation}
        </button>
      </div>

      <div className="flex flex-col gap-10">
        {sorted.map(({ brand, branches }) => (
          <section key={brand.id} className="scroll-mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {brand.hasLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/brands/${brand.id}/logo`}
                    alt={`${brand.name} logo`}
                    className="size-16 shrink-0 rounded-full border-2 border-ink bg-white object-contain shadow-[2px_2px_0_#262321]"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-white shadow-[2px_2px_0_#262321]">
                    <Store className="size-6 text-tomato" />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="break-words font-display text-[2rem] leading-none tracking-tight">{brand.name}</h2>
                  {brand.description && (
                    <p className="mt-1 line-clamp-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
                      {brand.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {brand.instagram && (
                  <a
                    href={`https://instagram.com/${brand.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm text-muted"
                  >
                    <AtSign className="size-3.5" /> {brand.instagram}
                  </a>
                )}
                {brand.hasMenu && (
                  <a
                    href={`/api/brands/${brand.id}/menu`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm text-muted"
                  >
                    <FileText className="size-3.5" /> {t.brand.menu}
                  </a>
                )}
                <Link href={`/b/${brand.slug}`} className="btn btn-soft btn-sm">
                  {t.picker.brandPage} <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {branches.map(({ branch, snapshot, distance }, index) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  snapshot={snapshot}
                  distance={distance}
                  nearest={coords !== null && index === 0 && distance !== null}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BranchCard({
  branch,
  snapshot,
  distance,
  nearest,
}: {
  branch: BranchSummary;
  snapshot: PublicSnapshot | null;
  distance: number | null;
  nearest: boolean;
}) {
  const { t } = useLang();
  const open = snapshot?.isOpenNow ?? branch.waitlistStatus === "open";
  const statusLabel =
    branch.waitlistStatus === "paused"
      ? t.guest.paused
      : branch.waitlistStatus === "closed"
        ? t.guest.closed
        : open
          ? t.guest.openNow
          : t.guest.outsideHours;
  const statusTone =
    branch.waitlistStatus === "paused"
      ? "status-waiting"
      : branch.waitlistStatus === "closed"
        ? "status-muted"
        : open
          ? "status-seated"
          : "status-muted";

  return (
    <Link
      href={`/b/${branch.brandSlug}/${branch.slug}`}
      className="group flex flex-col rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#262321] transition hover:-translate-y-0.5 hover:bg-cream/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">{branch.brandName}</p>
          <h3 className="mt-0.5 font-display text-2xl leading-tight">{branch.name}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`pill ${statusTone}`}>
            {statusTone === "status-seated" && <span className="live-dot" />}
            {statusLabel}
          </span>
          {nearest && <span className="pill status-seated">{t.picker.nearest}</span>}
        </div>
      </div>

      {branch.address && (
        <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-relaxed text-muted">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-tomato" /> {branch.address}
        </p>
      )}
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-2">
          <Clock3 className="size-3.5 text-tomato" /> {branch.openTime}–{branch.closeTime} · {branch.timezone}
        </span>
        {distance !== null && (
          <span className="inline-flex items-center gap-1 font-extrabold text-leaf-dark">
            <Navigation className="size-3.5" /> {formatDistance(distance)}
          </span>
        )}
      </p>

      <div className={`mt-4 grid gap-1.5 ${branch.queueMode === "single" ? "grid-cols-2" : "grid-cols-3"}`}>
        {branch.queueMode === "single" ? (
          <>
            <div className="rounded-xl border-2 border-ink/15 bg-pink/60 px-2 py-2 text-center">
              <p className="num font-display text-xl font-semibold">{snapshot?.waiting ?? "—"}</p>
              <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.statsWaiting}</p>
            </div>
            <div className="rounded-xl border-2 border-ink/15 bg-leaf-soft px-2 py-2 text-center">
              <p className="num font-display text-xl font-semibold">{snapshot?.lastCalledCode ?? "—"}</p>
              <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.statsServing}</p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border-2 border-ink/15 bg-pink/60 px-2 py-2 text-center">
              <p className="num font-display text-xl font-semibold">{snapshot?.waitingA ?? "—"}</p>
              <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.queueAShort}</p>
            </div>
            <div className="rounded-xl border-2 border-ink/15 bg-cream px-2 py-2 text-center">
              <p className="num font-display text-xl font-semibold">{snapshot?.waitingB ?? "—"}</p>
              <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.queueBShort}</p>
            </div>
            <div className="rounded-xl border-2 border-ink/15 bg-leaf-soft px-2 py-2 text-center">
              <p className="num font-display text-xl font-semibold">{snapshot?.lastCalledCode ?? "—"}</p>
              <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.08em] text-ink/50">{t.guest.statsServing}</p>
            </div>
          </>
        )}
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-tomato">
        {t.picker.joinBranch} <ArrowUpRight className="size-3.5" />
      </span>
    </Link>
  );
}
