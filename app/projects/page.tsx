import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Practical systems, experiments, and software foundations by Marvel Harisson.",
};

export default function ProjectsPage() {
  return (
    <main className="dark-page projects-page">
      <header className="page-header">
        <h1>Projects</h1>
        <p>Practical systems, experiments, and foundations.</p>
      </header>
      <section className="projects-grid" aria-label="Project gallery">
        {projects.map((project, index) => <ProjectCard key={project.slug} project={project} index={index} />)}
      </section>
    </main>
  );
}
