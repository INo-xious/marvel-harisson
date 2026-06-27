import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyLayout } from "@/components/case-study-layout";
import { getProjectBySlug } from "@/data/localized-data";
import { projects } from "@/data/projects";
import { getRequestLocale } from "@/data/request-locale";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const project = getProjectBySlug(slug, locale);
  return project ? { title: project.title, description: project.description } : { title: "Project not found" };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const project = getProjectBySlug(slug, locale);
  if (!project) notFound();
  return <CaseStudyLayout project={project} locale={locale} />;
}
