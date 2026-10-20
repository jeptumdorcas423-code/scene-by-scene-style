import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Shuffle, ThumbsUp, RotateCw, Layers, BookOpen } from "lucide-react";
import { FLASHCARDS } from "@/lib/content/flashcards";
import { CATEGORIES, type Category } from "@/lib/content/types";
import { getTopic } from "@/lib/content/topics";
import { actions, useAppState } from "@/lib/store";
import { cardCounts } from "@/lib/stats";
import { shuffle } from "@/lib/quiz";
import { Callout, CategoryBadge, EmptyState, PageHeader } from "@/components/kit";
import { pageHead } from "@/lib/seo";

type Search = { topic?: string; category?: Category; mode?: "difficult" };

export const Route = createFileRoute("/flashcards")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    topic: typeof s.topic === "string" ? s.topic : undefined,
    category: ["concepts", "architecture", "management"].includes(s.category as string) ? (s.category as Category) : undefined,
    mode: s.mode === "difficult" ? "difficult" : undefined,
  }),
  head: () => pageHead("Flashcards", "Flip through original Azure flashcards, mark what you know, and focus on difficult cards."),
  component: Flashcards,
});

function Flashcards() {
  const search = Route.useSearch();
  const s = useAppState();
  const topic = search.topic ? getTopic(search.topic) : undefined;
  const topicCards = topic ? FLASHCARDS.filter((f) => f.topicId === topic.id) : [];
  const initialCat = search.category ?? (topic && !topicCards.length ? topic.category : undefined);
  const [cat, setCat] = useState<Category | undefined>(initialCat);
  const [topicOnly, setTopicOnly] = useState(!!topicCards.length);
  const [difficult, setDifficult] = useState(search.mode === "difficult");
  const [order, setOrder] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(() => {
    let d = topicOnly && topic ? topicCards : FLASHCARDS.filter((f) => !cat || f.category === cat);
    if (difficult) d = d.filter((f) => s.cards[f.id] === "practice");
    if (order) d = [...d].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, topicOnly, difficult, order, s.cards]);

  useEffect(() => { setI(0); setFlipped(false); }, [cat, topicOnly, difficult, order]);
  const idx = Math.min(i, Math.max(0, deck.length - 1));
  const card = deck[idx];
  const counts = cardCounts(s);

  const go = (d: number) => { setFlipped(false); setI((x) => (deck.length ? (Math.min(x, deck.length - 1) + d + deck.length) % deck.length : 0)); };
  const flip = () => { setFlipped((f) => !f); if (card) actions.viewCard(card.id); };
  const mark = (status: "know" | "practice") => { if (!card) return; actions.setCard(card.id, status); if (!difficult || status === "practice") go(1); };

  return (
    <>
      <PageHeader title="Flashcard Coach" subtitle="Tap a card to flip it. Mark each one so you know what to revisit.">
        <span className="chip">Reviewed {counts.reviewed}/{counts.total}</span>
        <span className="chip text-teal">Know it {counts.know}</span>
        <span className="chip text-amber-ink">Needs practice {counts.practice}</span>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter cards">
        {topic && topicCards.length > 0 && (
          <button className="chip" aria-pressed={topicOnly} onClick={() => setTopicOnly((v) => !v)}>Topic: {topic.title}</button>
        )}
        <button className="chip" aria-pressed={!topicOnly && !cat} onClick={() => { setTopicOnly(false); setCat(undefined); }}>All topics</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className="chip" aria-pressed={!topicOnly && cat === c.id} onClick={() => { setTopicOnly(false); setCat(c.id); }}>{c.short}</button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <button className="chip" aria-pressed={difficult} onClick={() => setDifficult((v) => !v)}>Difficult cards only</button>
        <button className="chip" onClick={() => setOrder(shuffle(FLASHCARDS.map((f) => f.id)))}><Shuffle className="h-3.5 w-3.5" /> Shuffle</button>
      </div>
      {topic && !topicCards.length && <div className="mb-5"><Callout>No cards are dedicated to “{topic.title}” yet, so here are cards from the same skill area.</Callout></div>}

      {!card ? (
        <EmptyState icon={Layers} title={difficult ? "No difficult cards" : "No cards here"} body={difficult ? "You haven't marked any cards as “Needs Practice” in this selection. Nice!" : "Try another filter."}>
          <button className="btn btn-outline" onClick={() => { setDifficult(false); setCat(undefined); setTopicOnly(false); }}>Show all cards</button>
        </EmptyState>
      ) : (
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-center text-sm text-muted-foreground">Card {idx + 1} of {deck.length}</p>
          <div className="flip-scene">
            <button onClick={flip} aria-label={flipped ? "Show front of card" : "Flip card to see the answer"} className="flip-card relative block h-72 w-full text-left sm:h-80" data-flipped={flipped}>
              <div className="flip-face surface absolute inset-0 flex flex-col p-6 sm:p-8">
                <div className="flex items-center justify-between gap-2"><CategoryBadge category={card.category} />{s.cards[card.id] && <StatusPill status={s.cards[card.id]} />}</div>
                <p className="m-auto text-center font-display text-2xl font-bold sm:text-3xl">{card.front}</p>
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><RotateCw className="h-3.5 w-3.5" /> Tap to flip</p>
              </div>
              <div className="flip-face flip-back absolute inset-0 flex flex-col rounded-[var(--radius-xl)] border border-primary/20 bg-primary-soft p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Answer</p>
                <div className="m-auto text-center">
                  <p className="text-lg sm:text-xl">{card.back}</p>
                  {card.example && <p className="mt-3 text-sm text-teal"><strong>Example:</strong> {card.example}</p>}
                </div>
                <Link to="/learn" search={{ topic: card.topicId }} onClick={(e) => e.stopPropagation()} className="mx-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><BookOpen className="h-3.5 w-3.5" /> Open lesson</Link>
              </div>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="btn btn-outline border-amber/50 text-amber-ink" onClick={() => mark("practice")}><RotateCw className="h-4 w-4" /> Needs Practice</button>
            <button className="btn btn-teal" onClick={() => mark("know")}><ThumbsUp className="h-4 w-4" /> Know It</button>
          </div>
          <div className="mt-3 flex justify-between">
            <button className="btn btn-ghost" onClick={() => go(-1)}><ChevronLeft className="h-4 w-4" /> Previous</button>
            <button className="btn btn-ghost" onClick={() => go(1)}>Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: "know" | "practice" }) {
  return status === "know"
    ? <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-semibold text-teal">Know it</span>
    : <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-semibold text-amber-ink">Needs practice</span>;
}
