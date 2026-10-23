import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, Info, ArrowRight } from "lucide-react";
import { useAppState } from "@/lib/store";
import { CATEGORIES } from "@/lib/content/types";
import { byCategory, cardCounts, MIN_ANSWERS_FOR_READINESS, overall, readiness, recommendations, weakTopics } from "@/lib/stats";
import { Callout, PageHeader, ProgressBar, StatCard } from "@/components/kit";
import { CheckCircle2, Layers, ListChecks, Target, ClipboardCheck, AlertCircle } from "lucide-react";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/readiness")({
  head: () => pageHead("Exam Readiness", "An honest progress indicator built from your real quiz, flashcard and study activity."),
  component: Readiness,
});

function Readiness() {
  const s = useAppState();
  const o = overall(s);
  const r = readiness(s);
  const bc = byCategory(s);
  const cards = cardCounts(s);
  const weak = weakTopics(s);
  const recs = recommendations(s);

  return (
    <>
      <PageHeader title="Exam Readiness" subtitle="An educational progress indicator based on your actual activity—not a guarantee of exam success." />

      <section className="surface flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Gauge className="h-8 w-8" /></span>
        {r.sufficient ? (
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Readiness indicator</p>
            <p className="font-display text-4xl font-extrabold text-primary">{r.score}<span className="text-xl text-muted-foreground">/100</span></p>
            <p className="mt-1 text-sm">{r.score >= 75 ? "Strong progress—keep practising to stay sharp." : r.score >= 50 ? "Solid foundation—focus on the topics below." : "Building up—steady practice will move this number."}</p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="font-display text-xl font-bold">Keep practising to build a reliable readiness estimate.</p>
            <p className="mt-1 text-sm text-muted-foreground">Answer at least {MIN_ANSWERS_FOR_READINESS} quiz questions to unlock it ({o.answered}/{MIN_ANSWERS_FOR_READINESS} so far).</p>
            <Link to="/quiz" className="btn btn-primary mt-3">Start a quiz</Link>
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={Target} label="Overall accuracy" value={o.answered ? `${o.accuracy}%` : "—"} />
        <StatCard icon={ListChecks} label="Questions answered" value={o.answered} />
        <StatCard icon={CheckCircle2} label="Flashcards: Know It" value={cards.know} tone="teal" />
        <StatCard icon={Layers} label="Flashcards: Needs Practice" value={cards.practice} tone="amber" />
        <StatCard icon={AlertCircle} label="Mistakes reviewed" value={`${s.mistakes.filter((m) => m.reviewed).length}/${s.mistakes.length}`} />
        <StatCard icon={ClipboardCheck} label="Study tasks completed" value={s.tasks.filter((t) => t.done).length} tone="teal" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="surface space-y-4 p-5">
          <h2 className="font-bold">Performance by skill area</h2>
          {CATEGORIES.map((c) => (
            <div key={c.id}>
              <ProgressBar label={c.label} value={bc[c.id].accuracy} tone="teal" />
              <p className="mt-1 text-xs text-muted-foreground">{bc[c.id].correct}/{bc[c.id].answered} correct</p>
            </div>
          ))}
          {weak.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Topics that need revision</p>
              <div className="flex flex-wrap gap-2">
                {weak.map((w) => <Link key={w.topic.id} to="/learn" search={{ topic: w.topic.id }} className="chip">{w.topic.title} · {w.perf.accuracy}%</Link>)}
              </div>
            </div>
          )}
        </section>

        <section className="surface p-5">
          <h2 className="font-bold">Personalised recommendations</h2>
          {recs.length ? (
            <ul className="mt-3 space-y-2">
              {recs.map((x, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-amber-soft p-3 text-sm">
                  <span className="text-amber-ink">{x.text}</span>
                  <Link to={x.to} search={x.search as never} className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline">{x.cta} <ArrowRight className="h-3.5 w-3.5" /></Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{o.answered ? "No weak areas detected yet—try an extended quiz to test yourself further." : "Recommendations appear once you've completed some quizzes."}</p>
          )}
        </section>
      </div>

      <div className="mt-6">
        <Callout tone="primary">
          <p className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4" /> How this is calculated</p>
          <p className="mt-1 text-foreground">
            {r.parts.map((p) => `${p.label} (${p.weight}%)`).join(" + ")}. Coverage counts skill areas with at least 3 answered questions. The indicator only appears after {MIN_ANSWERS_FOR_READINESS} answers. It is an educational progress indicator, not a prediction or guarantee that you will pass the official exam.
          </p>
        </Callout>
      </div>
    </>
  );
}
