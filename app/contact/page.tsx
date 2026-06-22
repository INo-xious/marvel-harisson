import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import { GitHubMark, LinkedInMark } from "@/components/brand-icons";
import { contactLinks } from "@/data/contact";

export const metadata: Metadata = { title: "Contact", description: "Contact Marvel Harisson." };

const iconByKind = { github: GitHubMark, linkedin: LinkedInMark, email: Mail };

export default function ContactPage() {
  return (
    <main className="editorial-page contact-page">
      <header className="contact-header">
        <h1 className="block-page-title">Contact</h1>
        <p>Open to learning opportunities, collaborations, project feedback, and conversations about software engineering, robotics, and practical systems.</p>
      </header>
      <section className="contact-list" aria-label="Contact options">
        {contactLinks.map((item) => {
          const Icon = iconByKind[item.kind];
          const content = <><Icon aria-hidden="true" size={22} /><div><span>{item.label}</span><strong>{item.value}</strong><p>{item.note}</p></div>{item.href ? <ArrowUpRight aria-hidden="true" size={18} /> : <span className="contact-unavailable">Unpublished</span>}</>;
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
