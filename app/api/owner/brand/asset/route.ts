import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageBrand, setBrandAsset } from "@/lib/store";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const MENU_TYPES = ["application/pdf", "application/x-pdf", "application/octet-stream", ""];

function extension(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json<ActionResult>({ ok: false, message: "Owner access required." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json<ActionResult>({ ok: false, message: "Invalid upload." }, { status: 400 });
  }

  const brandId = Number(form.get("brandId"));
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (!Number.isInteger(brandId) || brandId <= 0) {
    return NextResponse.json<ActionResult>({ ok: false, message: "Choose a brand." }, { status: 400 });
  }
  if (kind !== "logo" && kind !== "menu") {
    return NextResponse.json<ActionResult>({ ok: false, message: "Unknown asset type." }, { status: 400 });
  }
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json<ActionResult>({ ok: false, message: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json<ActionResult>({ ok: false, message: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json<ActionResult>(
      { ok: false, message: "Files must be 4 MB or smaller. Compress the PDF/image and try again." },
      { status: 400 },
    );
  }
  if (!(await canManageBrand(session, brandId))) {
    return NextResponse.json<ActionResult>({ ok: false, message: "You don't have access to this brand." }, { status: 403 });
  }

  const filename = typeof file.name === "string" ? file.name : "";
  const ext = extension(filename);
  let mime = String(file.type || "").toLowerCase();
  if (mime === "image/jpg") mime = "image/jpeg";

  if (kind === "logo") {
    const okType = LOGO_TYPES.includes(mime);
    const okExt = ["png", "jpg", "jpeg", "webp", "svg"].includes(ext);
    if (!okType && !okExt) {
      return NextResponse.json<ActionResult>(
        { ok: false, message: "Logos must be PNG, JPG, WEBP or SVG." },
        { status: 400 },
      );
    }
    if (!mime) {
      mime = ext === "svg" ? "image/svg+xml" : ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
    }
  } else {
    const okType = MENU_TYPES.includes(mime);
    const okExt = ext === "pdf";
    if (!okType && !okExt) {
      return NextResponse.json<ActionResult>({ ok: false, message: "Menus must be a PDF." }, { status: 400 });
    }
    mime = "application/pdf";
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await setBrandAsset(brandId, kind, bytes, mime, kind === "menu" ? filename || "menu.pdf" : null, session.name);
    return NextResponse.json<ActionResult>(
      { ok: true, message: kind === "logo" ? "Logo uploaded." : "Menu PDF uploaded." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[antriq] brand asset upload failed", error);
    return NextResponse.json<ActionResult>(
      { ok: false, message: "The upload could not be saved. Please try a smaller file." },
      { status: 500 },
    );
  }
}
