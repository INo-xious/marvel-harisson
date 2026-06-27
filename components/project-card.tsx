"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Project } from "@/data/projects";

export function ProjectCard({
  project,
  index,
  isRevealed = false,
  onReveal,
  ariaLabel,
}: {
  project: Project;
  index: number;
  isRevealed?: boolean;
  onReveal?: (slug: string) => void;
  ariaLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const lastPointerTypeRef = useRef<string | null>(null);

  return (
    <motion.article
      className={`project-card project-card-${index + 1}`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.055, duration: 0.28 }}
    >
      <Link
        href={project.route}
        className="project-card-link"
        aria-label={`${ariaLabel}: ${project.title}`}
        data-revealed={isRevealed || undefined}
        onPointerDown={(event) => {
          lastPointerTypeRef.current = event.pointerType;
        }}
        onClick={(event) => {
          if (!onReveal || !lastPointerTypeRef.current || lastPointerTypeRef.current === "mouse" || isRevealed) return;
          event.preventDefault();
          onReveal(project.slug);
        }}
      >
        <div className="project-card-media">
          <Image
            src={project.image}
            alt={project.imageAlt}
            fill
            priority={index < 3}
            sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 34vw"
          />
        </div>
        <div className="project-card-overlay">
          <h2>{project.title}</h2>
          <p>{project.description}</p>
        </div>
      </Link>
    </motion.article>
  );
}
