import { describe, expect, it } from "vitest";
import { SALES_PHONE, SALES_PLANS, SALES_TYPES, salesWhatsAppHref } from "@/lib/sales";

describe("sales WhatsApp link", () => {
  it("uses the sales number and a generic message", () => {
    const href = salesWhatsAppHref({ lang: "id" });
    const url = new URL(href);
    expect(url.host).toBe("api.whatsapp.com");
    expect(url.pathname).toBe("/send");
    expect(url.searchParams.get("phone")).toBe(SALES_PHONE);
    expect(url.searchParams.get("text")).toContain("Rp65.000/bulan");
  });

  it("prefills the name, business, type and plan", () => {
    const href = salesWhatsAppHref({ name: "Ayu", business: "Klinik Sehat", type: "Klinik", plan: "Starter", lang: "id" });
    const text = new URL(href).searchParams.get("text") ?? "";
    expect(text).toContain("Ayu");
    expect(text).toContain("Klinik Sehat");
    expect(text).toContain("Klinik");
    expect(text).toContain("paket Starter");
    expect(SALES_TYPES.length).toBeGreaterThan(5);
  });

  it("offers the SaaS matrix with a free tier and 65k annual entry", () => {
    expect(SALES_PLANS.map((plan) => plan.id)).toEqual(["free", "starter", "pro", "business"]);
    expect(SALES_PLANS[0].monthly).toBe("Rp0");
    expect(SALES_PLANS[1].monthly).toBe("Rp79.000");
    expect(SALES_PLANS[1].annual).toBe("Rp65.000");
    expect(SALES_PLANS[1].annualYear).toBe("Rp780rb");
    expect(SALES_PLANS.find((plan) => plan.popular)?.id).toBe("pro");
  });
});
