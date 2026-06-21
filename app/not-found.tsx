import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found editorial-page">
      <p className="mono-label">404</p>
      <h1>That project is not on the map.</h1>
      <Link href="/projects">Return to projects</Link>
    </main>
  );
}
