import type { Metadata } from "next";
import { ScrambleText } from "@/components/scramble-text";
import { siteCopy } from "@/data/locale";
import { getRequestLocale } from "@/data/request-locale";

export const metadata: Metadata = { title: "About", description: "About Marvel Harisson, a software engineering student in Osaka." };

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale].about;

  return (
    <main className="editorial-page about-page">
      <div className="about-grid">
        <section className="about-intro">
          <h1 className="block-page-title"><ScrambleText text={copy.title} /></h1>
          <p className="about-lead"><ScrambleText text={copy.lead} /></p>
          <p className="about-support"><ScrambleText text={copy.support} /></p>
        </section>
        <aside className="identity-card" aria-label={copy.cardLabel}>
          <div className="identity-mark" aria-hidden="true">MH</div>
          <dl>
            <div><dt><ScrambleText text={copy.identity.name} /></dt><dd>Marvel Harisson</dd></div>
            <div><dt><ScrambleText text={copy.identity.location} /></dt><dd>Osaka, Japan</dd></div>
            <div><dt><ScrambleText text={copy.identity.graduation} /></dt><dd><ScrambleText text={copy.identity.expectedGraduation} /></dd></div>
            <div><dt><ScrambleText text={copy.identity.handle} /></dt><dd>INo-xious</dd></div>
          </dl>
          <div className="identity-tiles" aria-hidden="true">{Array.from({ length: 14 }).map((_, index) => <i key={index} />)}</div>
        </aside>
      </div>
      <div className="about-lists">
        <section><h2><ScrambleText text={copy.learningTitle} /></h2><ol>{copy.learning.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><ScrambleText text={item} /></li>)}</ol></section>
        <section><h2><ScrambleText text={copy.interestsTitle} /></h2><ol>{copy.interests.map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><ScrambleText text={item} /></li>)}</ol></section>
        <section><h2><ScrambleText text={copy.beyondCodeTitle} /></h2><p><ScrambleText text={copy.beyondCode} /></p></section>
      </div>
    </main>
  );
}
