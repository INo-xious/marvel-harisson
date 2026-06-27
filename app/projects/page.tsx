import type { Metadata } from "next";
import { ProjectGallery } from "@/components/project-gallery";
import { ScrambleText } from "@/components/scramble-text";
import { getProjects } from "@/data/localized-data";
import { siteCopy } from "@/data/locale";
import { getRequestLocale } from "@/data/request-locale";

export const metadata: Metadata = {
  title: "Projects",
  description: "Practical systems, experiments, and software foundations by Marvel Harisson.",
};

export default async function ProjectsPage() {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale].projects;
  const projects = getProjects(locale);

  return (
    <main className="dark-page projects-page">
      <header className="page-header">
        <h1><ScrambleText text={copy.title} /></h1>
        <p><ScrambleText text={copy.description} /></p>
      </header>
      <ProjectGallery projects={projects} ariaLabel={copy.galleryLabel} cardAriaLabel={copy.viewCaseStudy} />
    </main>
  );
}
