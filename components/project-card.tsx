"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { projectStatusLabels } from "@/data/projects";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.article
      className={`project-card project-card-${index + 1}`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.055, duration: 0.28 }}
    >
      <Link href={project.route} className="project-card-link" aria-label={`View ${project.title} case study`}>
        <div className="project-card-media">
          <Image
            src={project.image}
            alt={project.imageAlt}
            fill
            priority={index < 3}
            sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 34vw"
          />
          <span className="project-card-action">View case study <ArrowUpRight aria-hidden="true" size={15} /></span>
        </div>
        <div className="project-card-copy">
          <div>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
          </div>
          <dl>
            <div><dt className="sr-only">Year</dt><dd>{project.year}</dd></div>
            <div><dt className="sr-only">Status</dt><dd>{projectStatusLabels[project.status]}</dd></div>
          </dl>
        </div>
      </Link>
    </motion.article>
  );
}
