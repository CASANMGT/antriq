"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { Modal } from "@/components/Modal";
import { useLang } from "@/components/LanguageProvider";
import { format } from "@/lib/i18n";

export function BranchQrModal({
  open,
  onClose,
  brandSlug,
  branchName,
  branchSlug,
}: {
  open: boolean;
  onClose: () => void;
  brandSlug: string;
  branchName: string;
  branchSlug: string;
}) {
  const { t } = useLang();
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const target = `${window.location.origin}/b/${brandSlug}/${branchSlug}`;
    setUrl(target);
    setQr(null);
    setError(false);
    QRCode.toDataURL(target, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#262321", light: "#FFFDF7" },
    })
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, brandSlug, branchSlug]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.host.qrTitle}
      description={format(t.host.qrDesc, { branch: branchName })}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#262321]">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={format(t.host.qrAlt, { branch: branchName })} className="size-64" />
          ) : (
            <div className="grid size-64 place-items-center text-xs font-semibold text-muted">
              {error ? (
                t.host.qrError
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> {t.host.qrLoading}
                </span>
              )}
            </div>
          )}
        </div>
        {url && <p className="num break-all text-center text-[0.6875rem] font-bold text-muted">{url}</p>}
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
            <ExternalLink className="size-3.5" /> {t.host.qrOpenGuest}
          </a>
        )}
      </div>
    </Modal>
  );
}
