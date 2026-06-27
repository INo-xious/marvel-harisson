import type { Metadata } from "next";
import { LabGallery } from "@/components/lab-gallery";
import { RitsumeikanLabs } from "@/components/ritsumeikan-labs";
import { getLabItems, getRitsumeikanLabs } from "@/data/localized-data";
import { siteCopy } from "@/data/locale";
import { getRequestLocale } from "@/data/request-locale";

export const metadata: Metadata = { title: "Lab", description: "Current work in progress." };

export default async function LabPage() {
  const locale = await getRequestLocale();
  const copy = siteCopy[locale].lab;
  const labItems = getLabItems(locale);
  const ritsumeikanLabs = getRitsumeikanLabs(locale);

  return (
    <main className="dark-page lab-page">
      <header className="page-header">
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <LabGallery items={labItems} />
      <RitsumeikanLabs labs={ritsumeikanLabs} copy={copy} />
    </main>
  );
}
