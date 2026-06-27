import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import { GitHubMark, LinkedInMark } from "@/components/brand-icons";
import { getContactLinks } from "@/data/localized-data";
import { siteCopy } from "@/data/locale";
import { getRequestLocale } from "@/data/request-locale";

export const metadata: Metadata = { title: "Contact", description: "Contact Marvel Harisson." };

const iconByKind = { github: GitHubMark, linkedin: LinkedInMark, email: Mail };

export default async function ContactPage() {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale].contact;
  const contactLinks = getContactLinks(locale);

  return (
    <main className="editorial-page contact-page">
      <header className="contact-header">
        <h1 className="block-page-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <section className="contact-list" aria-label={copy.optionsLabel}>
        {contactLinks.map((item) => {
          const Icon = iconByKind[item.kind];
          const content = <><Icon aria-hidden="true" size={22} /><div><span>{item.label}</span><strong>{item.value}</strong><p>{item.note}</p></div>{item.href ? <ArrowUpRight aria-hidden="true" size={18} /> : <span className="contact-unavailable">{copy.unpublished}</span>}</>;
          const external = item.href?.startsWith("http");
          return item.href ? (
            <a key={item.kind} id={item.kind === "email" ? "email" : undefined} className="contact-row" href={item.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{content}</a>
          ) : (
            <div key={item.kind} id="email" className="contact-row contact-row-static">{content}</div>
          );
        })}
      </section>
    </main>
  );
}
