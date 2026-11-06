import { getBrandAsset } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const brandId = Number(id);
  if (!Number.isInteger(brandId) || brandId <= 0) {
    return new Response("Not found", { status: 404 });
  }
  const asset = await getBrandAsset(brandId, "menu");
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(asset.data), {
    headers: {
      "Content-Type": asset.mime,
      "Content-Disposition": `inline; filename="${(asset.filename ?? "menu.pdf").replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=86400",
    },
  });
}
