import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";

describe("QR poster", () => {
  it("encodes the branch URL into a decodable QR", async () => {
    const url = "https://antriq1.vercel.app/b/nikumaru/blok-m";
    const buffer = await QRCode.toBuffer(url, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: "H",
      type: "png",
      color: { dark: "#262321", light: "#FFFDF7" },
    });
    const png = PNG.sync.read(buffer);
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(decoded?.data).toBe(url);
  });
});
