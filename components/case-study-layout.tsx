import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { projectStatusLabels } from "@/data/projects";

export function CaseStudyLayout({ project }: { project: Project }) {
  return (
    <main className="case-study">
      <Link className="back-link" href="/projects"><ArrowLeft aria-hidden="true" size={16} /> Projects</Link>
      <header className="case-study-header">
        <h1>{project.title}</h1>
        <p className="case-study-meta">{project.category} · {project.year}</p>
        <p className="case-study-summary">{project.description}</p>
        <p className="case-study-tags">{project.tags.join(" · ")}</p>
      </header>
      <figure className="case-study-hero">
        <Image src={project.image} alt={project.imageAlt} fill priority sizes="(max-width: 1280px) 100vw, 1180px" />
        <figcaption>Concept visualization · replace with a verified project screenshot when available</figcaption>
      </figure>
      <div className="case-study-body">
        <aside className="case-study-index" aria-label="On this page">
          <p>On this page</p>
          <a href="#problem">Problem</a>
          <a href="#solution">Solution</a>
          <a href="#built">What I Built</a>
          <a href="#technical">Technical Details</a>
          <a href="#learned">What I Learned</a>
          <div className="case-study-repository">
            <span>{projectStatusLabels[project.status]}</span>
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">View repository <ArrowUpRight aria-hidden="true" size={14} /></a>
            ) : (
              <p>No public repository linked</p>
            )}
          </div>
        </aside>
        <article className="case-study-content">
          <section id="problem"><h2>Problem</h2><p>{project.caseStudy.problem}</p></section>
          <section id="solution"><h2>Solution</h2><p>{project.caseStudy.solution}</p></section>
          <section id="built"><h2>What I Built</h2><ul>{project.caseStudy.built.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section id="technical"><h2>Technical Details</h2><ul>{project.caseStudy.technicalDetails.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section id="learned"><h2>What I Learned</h2><ul>{project.caseStudy.lessons.map((item) => <li key={item}>{item}</li>)}</ul></section>
        </article>
      </div>
    </main>
  );
}
