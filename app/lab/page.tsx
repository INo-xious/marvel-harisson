import type { Metadata } from "next";
import { LabGallery } from "@/components/lab-gallery";
import { labItems } from "@/data/lab-items";

export const metadata: Metadata = { title: "Lab", description: "Experiments, sketches, and work in progress." };

export default function LabPage() {
  return (
    <main className="dark-page lab-page">
      <header className="page-header">
        <h1>Lab</h1>
        <p>Experiments, sketches, and work in progress.</p>
      </header>
      <LabGallery items={labItems} />
    </main>
  );
}
