import type { Metadata } from "next";
import { ScrambleText } from "@/components/scramble-text";
import { TimelineList } from "@/components/timeline-list";
import { siteCopy } from "@/data/locale";
import { getRequestLocale } from "@/data/request-locale";
import { getTimeline } from "@/data/timeline";

export const metadata: Metadata = { title: "Timeline", description: "A chronological index of projects and experiences." };

export default async function TimelinePage() {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale].timeline;
  const timeline = getTimeline(locale);

  return (
    <main className="dark-page timeline-page">
      <section className="timeline-shell">
        <header className="timeline-header">
          <h1><ScrambleText text={copy.title} /></h1>
          <p><ScrambleText text={copy.description} /></p>
        </header>
        <TimelineList entries={timeline} />
      </section>
    </main>
  );
}
