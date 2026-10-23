import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, ListChecks, Layers, Lightbulb, AlertTriangle, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { TOPICS, getTopic } from "@/lib/content/topics";
import { CATEGORIES, type Category, type Topic } from "@/lib/content/types";
import { CategoryBadge, Callout, EmptyState, PageHeader } from "@/components/kit";
import { pageHead } from "@/lib/seo";

type Search = { topic?: string; category?: Category; q?: string };

export const Route = createFileRoute("/learn")({
  validateSearch: (raw: Record<string, unknown>): Search => { const s = raw as { topic?: unknown; category?: unknown; mode?: unknown; q?: unknown; exclude?: unknown; start?: unknown }; return {
    topic: typeof s.topic === "string" ? s.topic : undefined,
    category: ["concepts", "architecture", "management"].includes(s.category as string) ? (s.category as Category) : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }; },
  head: () => pageHead("Learn", "A beginner-friendly Azure learning library covering cloud concepts, architecture, services, management and governance."),
  component: Learn,
});

function Learn() {
  const { topic, category, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/learn" });
  const t = topic ? getTopic(topic) : undefined;
  if (t) return <TopicDetail topic={t} />;

  const query = (q ?? "").toLowerCase().trim();
  const list = TOPICS.filter(
    (x) => (!category || x.category === category) && (!query || `${x.title} ${x.definition}`.toLowerCase().includes(query)),
  );

  return (
    <>
      <PageHeader title="Learn" subtitle={`${TOPICS.length} bite-sized lessons across the three AZ-900 skill areas. Pick a topic to get started.`} />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search topics</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" placeholder="Search topics, e.g. storage, policy, IaaS…" value={q ?? ""} onChange={(e) => navigate({ search: (p) => ({ ...p, q: e.target.value || undefined }), replace: true })} />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button className="chip" aria-pressed={!category} onClick={() => navigate({ search: (p) => ({ ...p, category: undefined }) })}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => navigate({ search: (p) => ({ ...p, category: c.id }) })}>{c.short}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Search} title="No topics found" body="Try a different word, or clear the filters to see all lessons.">
          <button className="btn btn-outline" onClick={() => navigate({ search: {} })}>Clear filters</button>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((x) => (
            <Link key={x.id} to="/learn" search={{ topic: x.id }} className="surface hover-lift flex flex-col gap-2 p-4">
              <CategoryBadge category={x.category} />
              <h2 className="font-bold">{x.title}</h2>
              <p className="line-clamp-3 text-sm text-muted-foreground">{x.definition}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function TopicDetail({ topic }: { topic: Topic }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const siblings = useMemo(() => TOPICS.filter((x) => x.category === topic.category), [topic.category]);
  const idx = siblings.findIndex((x) => x.id === topic.id);
  const next = siblings[idx + 1];

  return (
    <article key={topic.id}>
      <Link to="/learn" search={{ category: topic.category }} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>
      <div className="mb-6">
        <CategoryBadge category={topic.category} />
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{topic.title}</h1>
        <p className="mt-3 max-w-3xl text-lg">{topic.definition}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="surface p-5">
            <h2 className="mb-2 font-bold">In simple terms</h2>
            <p className="leading-relaxed text-muted-foreground">{topic.explanation}</p>
          </section>
          <Callout tone="teal">
            <p className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4" /> Real-world analogy</p>
            <p className="mt-1 text-foreground">{topic.analogy}</p>
          </Callout>
          <section className="surface p-5">
            <h2 className="mb-3 font-bold">Key facts to remember</h2>
            <ul className="space-y-2">
              {topic.facts.map((f) => (
                <li key={f} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{f}</li>
              ))}
            </ul>
          </section>
          {topic.misconception && (
            <Callout tone="amber">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Common misconception</p>
              <p className="mt-1 text-foreground">{topic.misconception}</p>
            </Callout>
          )}
        </div>

        <aside className="space-y-4">
          <section className="surface p-5" aria-labelledby="kc-h">
            <h2 id="kc-h" className="font-bold">Knowledge check</h2>
            <p className="mt-2 text-sm">{topic.check.question}</p>
            <div className="mt-3 space-y-2" role="radiogroup">
              {topic.check.options.map((o, i) => {
                const correct = submitted && i === topic.check.answer;
                const wrong = submitted && i === picked && i !== topic.check.answer;
                return (
                  <button key={o} role="radio" aria-checked={picked === i} disabled={submitted} onClick={() => setPicked(i)}
                    className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${correct ? "border-success-ink/30 bg-success-soft text-success-ink" : wrong ? "border-error-ink/30 bg-error-soft text-error-ink" : picked === i ? "border-primary bg-primary-soft" : "hover:border-primary/50"}`}>
                    {o}
                  </button>
                );
              })}
            </div>
            {submitted ? (
              <p className={`mt-3 flex gap-2 text-sm ${picked === topic.check.answer ? "text-success-ink" : "text-error-ink"}`}>
                {picked === topic.check.answer ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                <span>{picked === topic.check.answer ? "Correct! " : "Not quite. "}<span className="text-foreground">{topic.check.explanation}</span></span>
              </p>
            ) : (
              <button className="btn btn-primary mt-3 w-full" disabled={picked === null} onClick={() => setSubmitted(true)}>Check answer</button>
            )}
          </section>
          <Link to="/quiz" search={{ topic: topic.id }} className="btn btn-primary w-full"><ListChecks className="h-4 w-4" /> Practise related questions</Link>
          <Link to="/flashcards" search={{ topic: topic.id }} className="btn btn-outline w-full"><Layers className="h-4 w-4" /> Open related flashcards</Link>
          {next && (
            <Link to="/learn" search={{ topic: next.id }} className="btn btn-ghost w-full"><BookOpen className="h-4 w-4" /> Next: {next.title}</Link>
          )}
        </aside>
      </div>
    </article>
  );
}
