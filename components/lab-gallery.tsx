"use client";

import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { ScrambleText } from "@/components/scramble-text";
import type { LabItem } from "@/data/lab-items";

type LabGalleryItem = LabItem & { linkAriaLabel?: string };

export function LabGallery({ items }: { items: LabGalleryItem[] }) {
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
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 0.02, duration: 0.16 }}
          aria-label={item.linkAriaLabel ?? `Open ${item.title} on the Ri-one website in a new tab`}
        >
          <Image
            src={item.thumbnailImage}
            alt={item.alt}
            fill
            sizes="(max-width: 799px) calc(100vw - 24px), (max-width: 1100px) calc((100vw - 74px) / 2), 920px"
            loading={index === 0 ? "eager" : "lazy"}
          />
          <span className="lab-tile-caption">
            <b><ScrambleText text={item.title} /></b>
            <i>·</i>
            <span><ScrambleText text={item.category} /></span>
            <ExternalLink aria-hidden="true" size={13} />
          </span>
        </motion.a>
      ))}
    </div>
  );
}
