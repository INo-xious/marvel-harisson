"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ScrambleText } from "@/components/scramble-text";
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
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.025, duration: 0.18 }}
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
          const isTouchLike =
            lastPointerTypeRef.current !== "mouse" ||
            window.matchMedia("(hover: none), (pointer: coarse)").matches;
          if (!onReveal || !isTouchLike || isRevealed) return;
          event.preventDefault();
          onReveal(project.slug);
        }}
      >
        <div className="project-card-media">
          <Image
            src={project.thumbnailImage}
            alt={project.imageAlt}
            fill
            priority={index === 0}
            sizes="(max-width: 799px) calc(100vw - 24px), (max-width: 1100px) calc((100vw - 74px) / 2), calc((100vw - 80px) / 3)"
          />
        </div>
        <div className="project-card-overlay">
          <h2><ScrambleText text={project.title} /></h2>
          <p><ScrambleText text={project.description} /></p>
        </div>
      </Link>
    </motion.article>
  );
}
