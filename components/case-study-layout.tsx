import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrambleText } from "@/components/scramble-text";
import { projectStatusLabelsByLocale } from "@/data/localized-data";
import { siteCopy, type Locale } from "@/data/locale";
import type { Project } from "@/data/projects";

export function CaseStudyLayout({ project, locale }: { project: Project; locale: Locale }) {
  const copy = siteCopy[locale].caseStudy;

  return (
    <main className="case-study">
      <Link className="back-link" href="/projects"><ArrowLeft aria-hidden="true" size={16} /> <ScrambleText text={copy.back} /></Link>
      <header className="case-study-header">
        <h1><ScrambleText text={project.title} /></h1>
        <p className="case-study-meta">{project.category} · {project.year}</p>
        <p className="case-study-summary"><ScrambleText text={project.description} /></p>
        <p className="case-study-tags">{project.tags.join(" · ")}</p>
      </header>
      <figure className="case-study-hero" data-fit={project.imageFit ?? "cover"}>
        <Image src={project.image} alt={project.imageAlt} fill priority sizes="(max-width: 1280px) 100vw, 1180px" />
      </figure>
      <div className="case-study-body">
        <aside className="case-study-index" aria-label={copy.onThisPage}>
          <p><ScrambleText text={copy.onThisPage} /></p>
          <a href="#problem"><ScrambleText text={copy.problem} /></a>
          <a href="#solution"><ScrambleText text={copy.solution} /></a>
          {project.caseStudy.built?.length ? <a href="#built"><ScrambleText text={copy.built} /></a> : null}
          <a href="#technical"><ScrambleText text={copy.technical} /></a>
          {project.caseStudy.lessons?.length ? <a href="#learned"><ScrambleText text={copy.learned} /></a> : null}
          <div className="case-study-repository">
            <span><ScrambleText text={projectStatusLabelsByLocale[locale][project.status]} /></span>
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer"><ScrambleText text={copy.viewRepository} /> <ArrowUpRight aria-hidden="true" size={14} /></a>
            ) : (
              <p><ScrambleText text={copy.noRepository} /></p>
            )}
          </div>
        </aside>
        <article className="case-study-content">
          <section id="problem"><h2><ScrambleText text={copy.problem} /></h2><p><ScrambleText text={project.caseStudy.problem} /></p></section>
          <section id="solution"><h2><ScrambleText text={copy.solution} /></h2><p><ScrambleText text={project.caseStudy.solution} /></p></section>
          {project.caseStudy.built?.length ? <section id="built"><h2><ScrambleText text={copy.built} /></h2><ul>{project.caseStudy.built.map((item, index) => <li key={index}><ScrambleText text={item} /></li>)}</ul></section> : null}
          <section id="technical"><h2><ScrambleText text={copy.technical} /></h2><ul>{project.caseStudy.technicalDetails.map((item, index) => <li key={index}><ScrambleText text={item} /></li>)}</ul></section>
          {project.caseStudy.lessons?.length ? <section id="learned"><h2><ScrambleText text={copy.learned} /></h2><ul>{project.caseStudy.lessons.map((item, index) => <li key={index}><ScrambleText text={item} /></li>)}</ul></section> : null}
        </article>
      </div>
    </main>
  );
}
