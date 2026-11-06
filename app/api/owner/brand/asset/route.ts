import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageBrand, setBrandAsset } from "@/lib/store";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

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
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json<ActionResult>({ ok: false, message: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json<ActionResult>({ ok: false, message: "Files must be 4 MB or smaller." }, { status: 400 });
  }
  if (!(await canManageBrand(session, brandId))) {
    return NextResponse.json<ActionResult>({ ok: false, message: "You don't have access to this brand." }, { status: 403 });
  }

  const mime = file.type || (kind === "menu" ? "application/pdf" : "application/octet-stream");
  if (kind === "logo" && !LOGO_TYPES.includes(mime)) {
    return NextResponse.json<ActionResult>(
      { ok: false, message: "Logos must be PNG, JPG, WEBP or SVG." },
      { status: 400 },
    );
  }
  if (kind === "menu" && mime !== "application/pdf") {
    return NextResponse.json<ActionResult>({ ok: false, message: "Menus must be a PDF." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await setBrandAsset(brandId, kind, bytes, mime, kind === "menu" ? file.name : null, session.name);

  return NextResponse.json<ActionResult>(
    { ok: true, message: kind === "logo" ? "Logo uploaded." : "Menu PDF uploaded." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
