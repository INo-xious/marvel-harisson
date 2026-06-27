"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/data/projects";

export function ProjectGallery({
  projects,
  ariaLabel,
  cardAriaLabel,
}: {
  projects: Project[];
  ariaLabel: string;
  cardAriaLabel: string;
}) {
  const [revealedSlug, setRevealedSlug] = useState<string | null>(null);

  return (
    <section className="projects-grid" aria-label={ariaLabel}>
      {projects.map((project, index) => (
        <ProjectCard
          key={project.slug}
          project={project}
          index={index}
          isRevealed={revealedSlug === project.slug}
          onReveal={setRevealedSlug}
          ariaLabel={cardAriaLabel}
        />
      ))}
    </section>
  );
}
