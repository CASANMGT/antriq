import type { Lang } from "./i18n";

const ID_ZONES: Record<string, string> = {
  "Main dining": "Area utama",
  Terrace: "Teras",
  Counter: "Bar",
};

export function zoneLabel(zone: string, lang: Lang): string {
  if (lang === "en") return zone;
  return ID_ZONES[zone] ?? zone;
}
