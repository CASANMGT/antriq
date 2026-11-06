import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./i18n";

export { LANG_COOKIE };

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "en" ? "en" : "id";
}
