import type { Metadata } from "next";
import { LabGallery } from "@/components/lab-gallery";
import { RitsumeikanLabs } from "@/components/ritsumeikan-labs";
import { labItems } from "@/data/lab-items";
import { ritsumeikanLabs } from "@/data/ritsumeikan-labs";

export const metadata: Metadata = { title: "Lab", description: "Current work in progress." };

export default function LabPage() {
  return (
    <main className="dark-page lab-page">
      <header className="page-header">
        <h1>Lab</h1>
        <p>Current work in progress.</p>
      </header>
      <LabGallery items={labItems} />
      <RitsumeikanLabs labs={ritsumeikanLabs} />
    </main>
  );
}
