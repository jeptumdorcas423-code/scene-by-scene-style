import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Layers, MessageCircleQuestion, Search } from "lucide-react";
import { FAQS } from "@/lib/content/faq";
import { getTopic } from "@/lib/content/topics";
import { CATEGORIES, type Category } from "@/lib/content/types";
import { Callout, CategoryBadge, EmptyState, PageHeader } from "@/components/kit";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/buddy")({
  head: () => pageHead("Study Buddy", "Searchable, beginner-friendly answers to common Azure and cloud questions."),
  component: Buddy,
});

function Buddy() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | null>(null);
  const [open, setOpen] = useState<string | null>(FAQS[0].id);
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const list = FAQS.filter((f) => (!cat || f.category === cat) && (!words.length || words.some((w) => `${f.question} ${f.keywords.join(" ")} ${f.answer}`.toLowerCase().includes(w))));

  return (
    <>
      <PageHeader title="Study Buddy" subtitle="Quick, friendly answers to common Azure questions." />
      <Callout tone="primary">Study Buddy uses built-in learning content written for this app. It isn't a live AI chatbot and doesn't send your questions to any external service.</Callout>
      <div className="my-5 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search questions</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" placeholder="Ask something, e.g. “difference between policy and lock”" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="chip" aria-pressed={!cat} onClick={() => setCat(null)}>All</button>
          {CATEGORIES.map((c) => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.short}</button>)}
        </div>
      </div>
      {!list.length ? (
        <EmptyState icon={MessageCircleQuestion} title="That one isn't covered yet" body="Try different words, browse the Learn library, or pick a topic area above.">
          <Link to="/learn" search={{ q: q || undefined }} className="btn btn-primary"><BookOpen className="h-4 w-4" /> Search the Learn section</Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {list.map((f) => (
            <article key={f.id} className="surface p-4">
              <button className="flex w-full items-start justify-between gap-3 text-left" aria-expanded={open === f.id} onClick={() => setOpen(open === f.id ? null : f.id)}>
                <h2 className="font-bold">{f.question}</h2>
                <CategoryBadge category={f.category} />
              </button>
              {open === f.id && (
                <div className="mt-3">
                  <p className="leading-relaxed text-muted-foreground">{f.answer}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.topicIds.map((id) => <Link key={id} to="/learn" search={{ topic: id }} className="chip"><BookOpen className="h-3.5 w-3.5" /> {getTopic(id)?.title}</Link>)}
                    <Link to="/flashcards" search={{ topic: f.topicIds[0] }} className="chip"><Layers className="h-3.5 w-3.5" /> Flashcards</Link>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
