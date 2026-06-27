import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { projectStatusLabelsByLocale } from "@/data/localized-data";
import { siteCopy, type Locale } from "@/data/locale";
import type { Project } from "@/data/projects";

export function CaseStudyLayout({ project, locale }: { project: Project; locale: Locale }) {
  const copy = siteCopy[locale].caseStudy;

  return (
    <main className="case-study">
      <Link className="back-link" href="/projects"><ArrowLeft aria-hidden="true" size={16} /> {copy.back}</Link>
      <header className="case-study-header">
        <h1>{project.title}</h1>
        <p className="case-study-meta">{project.category} · {project.year}</p>
        <p className="case-study-summary">{project.description}</p>
        <p className="case-study-tags">{project.tags.join(" · ")}</p>
      </header>
      <figure className="case-study-hero" data-fit={project.imageFit ?? "cover"}>
        <Image src={project.image} alt={project.imageAlt} fill priority sizes="(max-width: 1280px) 100vw, 1180px" />
      </figure>
      <div className="case-study-body">
        <aside className="case-study-index" aria-label={copy.onThisPage}>
          <p>{copy.onThisPage}</p>
          <a href="#problem">{copy.problem}</a>
          <a href="#solution">{copy.solution}</a>
          {project.caseStudy.built?.length ? <a href="#built">{copy.built}</a> : null}
          <a href="#technical">{copy.technical}</a>
          {project.caseStudy.lessons?.length ? <a href="#learned">{copy.learned}</a> : null}
          <div className="case-study-repository">
            <span>{projectStatusLabelsByLocale[locale][project.status]}</span>
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">{copy.viewRepository} <ArrowUpRight aria-hidden="true" size={14} /></a>
            ) : (
              <p>{copy.noRepository}</p>
            )}
          </div>
        </aside>
        <article className="case-study-content">
          <section id="problem"><h2>{copy.problem}</h2><p>{project.caseStudy.problem}</p></section>
          <section id="solution"><h2>{copy.solution}</h2><p>{project.caseStudy.solution}</p></section>
          {project.caseStudy.built?.length ? <section id="built"><h2>{copy.built}</h2><ul>{project.caseStudy.built.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
          <section id="technical"><h2>{copy.technical}</h2><ul>{project.caseStudy.technicalDetails.map((item) => <li key={item}>{item}</li>)}</ul></section>
          {project.caseStudy.lessons?.length ? <section id="learned"><h2>{copy.learned}</h2><ul>{project.caseStudy.lessons.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
        </article>
      </div>
    </main>
  );
}
