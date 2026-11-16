import { describe, expect, it } from "vitest";
import { SALES_PHONE, SALES_TYPES, salesWhatsAppHref } from "@/lib/sales";

describe("sales WhatsApp link", () => {
  it("uses the sales number and a generic message", () => {
    const href = salesWhatsAppHref({ lang: "id" });
    const url = new URL(href);
    expect(url.host).toBe("api.whatsapp.com");
    expect(url.pathname).toBe("/send");
    expect(url.searchParams.get("phone")).toBe(SALES_PHONE);
    expect(url.searchParams.get("text")).toContain("Rp49.000/bulan");
  });

  it("prefills the name, business and type", () => {
    const href = salesWhatsAppHref({ name: "Ayu", business: "Klinik Sehat", type: "Klinik", lang: "id" });
    const text = new URL(href).searchParams.get("text") ?? "";
    expect(text).toContain("Ayu");
    expect(text).toContain("Klinik Sehat");
    expect(text).toContain("Klinik");
    expect(SALES_TYPES.length).toBeGreaterThan(5);
  });
});
