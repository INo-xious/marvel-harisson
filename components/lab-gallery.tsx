"use client";

import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type { LabItem } from "@/data/lab-items";

export function LabGallery({ items }: { items: LabItem[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="lab-grid" data-count={items.length}>
      {items.map((item, index) => (
        <motion.a
          key={item.id}
          className={`lab-tile lab-tile-${index + 1}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 0.045, duration: 0.25 }}
          aria-label={`Open ${item.title} on the Ri-one website in a new tab`}
        >
          <Image
            src={item.image}
            alt={item.alt}
            fill
            sizes="(max-width: 799px) 100vw, 920px"
            loading={index === 0 ? "eager" : "lazy"}
          />
          <span className="lab-tile-caption">
            <b>{item.title}</b>
            <i>·</i>
            <span>{item.category}</span>
            <ExternalLink aria-hidden="true" size={13} />
          </span>
        </motion.a>
      ))}
    </div>
  );
}
