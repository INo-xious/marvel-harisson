import Link from "next/link";
import { ScrambleText } from "@/components/scramble-text";
import { siteCopy } from "@/data/locale";
import { getRequestLocale } from "@/data/request-locale";

export default async function NotFound() {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale].notFound;

  return (
    <main className="not-found editorial-page">
      <p className="mono-label">404</p>
      <h1><ScrambleText text={copy.title} /></h1>
      <Link href="/projects"><ScrambleText text={copy.returnToProjects} /></Link>
    </main>
  );
}
