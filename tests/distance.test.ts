import { describe, expect, it } from "vitest";
import { distanceKm, formatDistance } from "@/lib/distance";

describe("distance", () => {
  it("returns zero for the same point", () => {
    expect(distanceKm({ lat: -6.2423, lng: 106.7997 }, { lat: -6.2423, lng: 106.7997 })).toBe(0);
  });

  it("calculates Blok M to Tebet in the expected range", () => {
    const km = distanceKm({ lat: -6.2423, lng: 106.7997 }, { lat: -6.2301, lng: 106.8522 });
    expect(km).toBeGreaterThan(5.5);
    expect(km).toBeLessThan(6.5);
  });

  it("formats metres and kilometres", () => {
    expect(formatDistance(0.85)).toBe("850 m");
    expect(formatDistance(6)).toBe("6.0 km");
    expect(formatDistance(12.4)).toBe("12 km");
  });
});
