"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ScrambleText } from "@/components/scramble-text";
import type { TimelineEntry } from "@/data/timeline";

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="timeline-list">
      {entries.map((entry, index) => {
        const content = (
          <>
            <ArrowRight className="timeline-arrow" aria-hidden="true" size={16} />
            <span className="timeline-title"><ScrambleText text={entry.title} /></span>
            <span className="timeline-description"><ScrambleText text={entry.description} /></span>
            <span className="timeline-leader" aria-hidden="true" />
            <time>{entry.year}</time>
          </>
        );

        const isExternal = entry.href?.startsWith("http");

        return (
          <motion.div
            key={`${entry.year}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduceMotion ? 0 : index * 0.018,
              duration: 0.14,
            }}
          >
            {entry.href ? (
              <Link
                href={entry.href}
                className="timeline-row"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
              >
                {content}
              </Link>
            ) : (
              <div className="timeline-row">{content}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
