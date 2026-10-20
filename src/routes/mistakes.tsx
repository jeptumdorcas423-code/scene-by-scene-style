import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Check, ListChecks, PartyPopper, Undo2, Lightbulb, Key } from "lucide-react";
import { actions, useAppState } from "@/lib/store";
import { getQuestion } from "@/lib/content/questions";
import { getTopic } from "@/lib/content/topics";
import { FLASHCARDS } from "@/lib/content/flashcards";
import { CATEGORIES, type Category } from "@/lib/content/types";
import { CategoryBadge, EmptyState, PageHeader } from "@/components/kit";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/mistakes")({
  head: () => pageHead("My Mistakes", "Review the questions you missed, understand why, and revise the related concepts."),
  component: Mistakes,
});

function Mistakes() {
  const s = useAppState();
  const [cat, setCat] = useState<Category | "all">("all");
  const [show, setShow] = useState<"open" | "reviewed" | "all">("open");

  const items = s.mistakes
    .map((m) => ({ m, q: getQuestion(m.questionId) }))
    .filter((x): x is { m: typeof x.m; q: NonNullable<typeof x.q> } => !!x.q)
    .filter((x) => cat === "all" || x.q.category === cat)
    .filter((x) => show === "all" || (show === "open" ? !x.m.reviewed : x.m.reviewed))
    .sort((a, b) => b.m.date.localeCompare(a.m.date));
  const open = s.mistakes.filter((m) => !m.reviewed).length;

  if (!s.mistakes.length) {
    return (
      <>
        <PageHeader title="My Mistakes" />
        <EmptyState icon={PartyPopper} title="No mistakes yet" body="When you miss a quiz question, it will appear here with an explanation so you can learn from it. Mistakes are a normal part of learning!">
          <Link to="/quiz" className="btn btn-primary"><ListChecks className="h-4 w-4" /> Take a quiz</Link>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Mistakes" subtitle={`Every mistake is a chance to learn. ${open} still to review, ${s.mistakes.length - open} reviewed.`} />
      <div className="mb-6 flex flex-wrap gap-2">
        {(["open", "reviewed", "all"] as const).map((v) => (
          <button key={v} className="chip" aria-pressed={show === v} onClick={() => setShow(v)}>{v === "open" ? "To review" : v === "reviewed" ? "Reviewed" : "All"}</button>
        ))}
        <span className="mx-1 hidden h-5 w-px self-center bg-border sm:block" />
        <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>All topics</button>
        {CATEGORIES.map((c) => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.short}</button>)}
      </div>

      {!items.length ? (
        <EmptyState icon={Check} title="Nothing here" body={show === "open" ? "You've reviewed every mistake in this selection. Well done!" : "No mistakes match these filters."} />
      ) : (
        <div className="space-y-4">
          {items.map(({ m, q }) => {
            const topic = getTopic(q.topicId);
            const hasCards = FLASHCARDS.some((f) => f.topicId === q.topicId);
            return (
              <article key={q.id} className="surface p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <CategoryBadge category={q.category} />
                  <span>{topic?.title}</span>
                  <span>· {new Date(m.date).toLocaleDateString()}</span>
                  {m.count > 1 && <span>· missed {m.count}×</span>}
                  {m.reviewed && <span className="rounded-full bg-teal-soft px-2 py-0.5 font-semibold text-teal">Reviewed</span>}
                </div>
                <h2 className="font-bold">{q.question}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-error-soft p-3 text-sm text-error-ink">
                    <p className="text-xs font-semibold uppercase">Your answer</p>
                    <p className="mt-1 font-medium">{q.options[m.selected]}</p>
                    <p className="mt-2 text-foreground">{q.wrongWhy?.[m.selected] ?? "This option doesn't match what the question describes—compare it with the correct answer's explanation."}</p>
                  </div>
                  <div className="rounded-lg bg-success-soft p-3 text-sm text-success-ink">
                    <p className="text-xs font-semibold uppercase">Correct answer</p>
                    <p className="mt-1 font-medium">{q.options[q.answer]}</p>
                    <p className="mt-2 text-foreground">{q.explanation}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-teal" /><span><strong>Analogy:</strong> {q.analogy ?? topic?.analogy}</span></p>
                  <p className="flex gap-2"><Key className="mt-0.5 h-4 w-4 shrink-0 text-amber" /><span><strong>Remember:</strong> {q.keyFact}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/learn" search={{ topic: q.topicId }} className="btn btn-outline"><BookOpen className="h-4 w-4" /> Revise This Concept</Link>
                  {hasCards && <Link to="/flashcards" search={{ topic: q.topicId }} className="btn btn-ghost">Flashcards</Link>}
                  <Link to="/quiz" search={{ topic: q.topicId, exclude: q.id, start: true }} className="btn btn-outline"><ListChecks className="h-4 w-4" /> Try Another Question</Link>
                  {m.reviewed ? (
                    <button className="btn btn-ghost" onClick={() => actions.markMistakeReviewed(q.id, false)}><Undo2 className="h-4 w-4" /> Mark as not reviewed</button>
                  ) : (
                    <button className="btn btn-teal" onClick={() => actions.markMistakeReviewed(q.id)}><Check className="h-4 w-4" /> Mark as Reviewed</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
