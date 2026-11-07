import { describe, expect, it } from "vitest";
import pkg from "../package.json";
import { APP_VERSION, RELEASE_DATE } from "@/lib/version";
import { RELEASES } from "@/lib/changelog";

describe("app version and changelog", () => {
  it("keeps the in-app version in sync with package.json", () => {
    expect(APP_VERSION).toBe(pkg.version);
    expect(RELEASE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("has a release entry for the current version", () => {
    expect(RELEASES[0]?.version).toBe(APP_VERSION);
    expect(RELEASES.every((release) => release.sections.length > 0)).toBe(true);
  });
});
