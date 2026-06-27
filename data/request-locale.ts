import { cookies } from "next/headers";
import { localeCookieName, normalizeLocale, type Locale } from "@/data/locale";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}
