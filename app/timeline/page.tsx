import type { Metadata } from "next";
import { TimelineList } from "@/components/timeline-list";
import { timeline } from "@/data/timeline";

export const metadata: Metadata = { title: "Timeline", description: "A chronological index of projects and experiences." };

export default function TimelinePage() {
  return (
    <main className="dark-page timeline-page">
      <section className="timeline-shell">
        <header className="timeline-header">
          <h1>Timeline</h1>
          <p>A chronological index of projects and experiments.</p>
        </header>
        <TimelineList entries={timeline} />
      </section>
    </main>
  );
}
