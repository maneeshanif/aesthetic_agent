/**
 * Foundation placeholder. Replaced in Commit 3 by the asymmetrical editorial
 * landing experience under `app/(public)/` described in design.md.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-4 px-6">
      <span className="pill-button inline-flex items-center gap-2 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-slate">
        <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
        After-hours clinical concierge
      </span>
      <h1 className="font-display text-5xl leading-tight text-espresso">Vespera&nbsp;AI</h1>
      <p className="max-w-prose text-slate">
        Foundation scaffold. The marketing site, dashboard, and clinical simulator arrive in the
        Phase&nbsp;1 frontend commit.
      </p>
    </main>
  );
}
