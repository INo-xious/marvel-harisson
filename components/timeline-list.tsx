"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { TimelineEntry } from "@/data/timeline";

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="timeline-list">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.href}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 0.045, duration: 0.22 }}
        >
          <Link href={entry.href} className="timeline-row">
            <ArrowRight className="timeline-arrow" aria-hidden="true" size={16} />
            <span className="timeline-title">{entry.title}</span>
            <span className="timeline-description">{entry.description}</span>
            <span className="timeline-leader" aria-hidden="true" />
            <time>{entry.year}</time>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
