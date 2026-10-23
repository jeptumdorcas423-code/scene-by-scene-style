import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, AlertCircle, ListChecks, LogOut, Trophy } from "lucide-react";
import { actions, uid, useAppState } from "@/lib/store";
import { CATEGORIES, categoryLabel, type Category, type Question } from "@/lib/content/types";
import { getTopic, TOPICS } from "@/lib/content/topics";
import { buildPool, shuffle } from "@/lib/quiz";
import { weakCategories, weakTopics } from "@/lib/stats";
import { Callout, CategoryBadge, PageHeader, ProgressBar } from "@/components/kit";
import { pageHead } from "@/lib/seo";

type Search = { topic?: string; category?: Category; mode?: "weak"; exclude?: string; start?: boolean };

export const Route = createFileRoute("/quiz")({
  validateSearch: (raw: Record<string, unknown>): Search => { const s = raw as { topic?: unknown; category?: unknown; mode?: unknown; q?: unknown; exclude?: unknown; start?: unknown }; return {
    topic: typeof s.topic === "string" ? s.topic : undefined,
    category: ["concepts", "architecture", "management"].includes(s.category as string) ? (s.category as Category) : undefined,
    mode: s.mode === "weak" ? "weak" : undefined,
    exclude: typeof s.exclude === "string" ? s.exclude : undefined,
    start: s.start === true || s.start === "true" ? true : undefined,
  }; },
  head: () => pageHead("Practice Quiz", "Original AZ-900 practice questions with instant feedback and clear explanations."),
  component: QuizPage,
});

type Scope = { kind: "all" } | { kind: "category"; id: Category } | { kind: "topic"; id: string } | { kind: "weak" };
interface Session { id: string; questions: Question[]; note?: string }

function QuizPage() {
  const search = Route.useSearch();
  const s = useAppState();
  const initialScope: Scope = search.topic ? { kind: "topic", id: search.topic } : search.category ? { kind: "category", id: search.category } : search.mode === "weak" ? { kind: "weak" } : { kind: "all" };
  const [scope, setScope] = useState<Scope>(initialScope);
  const [size, setSize] = useState(search.start ? 1 : 5);
  const [session, setSession] = useState<Session | null>(null);
  const weakCats = weakCategories(s);
  const weakTops = weakTopics(s).map((w) => w.topic.id);
  const hasWeak = weakCats.length > 0 || weakTops.length > 0;

  const start = (sc: Scope = scope, n = size) => {
    const { pool, note } = buildPool(
      sc.kind === "topic" ? { topic: sc.id, exclude: search.exclude }
      : sc.kind === "category" ? { category: sc.id, exclude: search.exclude }
      : sc.kind === "weak" ? { weak: weakCats, weakTopics: weakTops }
      : { exclude: search.exclude },
    );
    const qs = shuffle(pool).slice(0, n);
    const shortNote = qs.length < n && pool.length ? `Only ${qs.length} question${qs.length > 1 ? "s" : ""} available for this selection.` : undefined;
    setSession({ id: uid(), questions: qs, note: [note, shortNote].filter(Boolean).join(" ") || undefined });
  };

  const auto = useRef(false);
  useEffect(() => {
    if (search.start && !auto.current) {
      auto.current = true;
      start(initialScope, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (session) return <QuizRun key={session.id} session={session} onRetry={() => start()} onExit={() => setSession(null)} />;

  const sel = (sc: Scope) => JSON.stringify(sc) === JSON.stringify(scope);
  return (
    <>
      <PageHeader title="Practice Quiz" subtitle="Original questions to build your understanding. You'll get instant feedback and an explanation after every answer." />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface space-y-6 p-5 lg:col-span-2">
          <fieldset>
            <legend className="mb-3 font-bold">1. How many questions?</legend>
            <div className="flex flex-wrap gap-2">
              {[{ n: 5, l: "Quick · 5" }, { n: 10, l: "Standard · 10" }, { n: 20, l: "Extended · 20" }].map((o) => (
                <button key={o.n} className="chip" aria-pressed={size === o.n} onClick={() => setSize(o.n)}>{o.l}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 font-bold">2. Which questions?</legend>
            <div className="flex flex-wrap gap-2">
              <button className="chip" aria-pressed={sel({ kind: "all" })} onClick={() => setScope({ kind: "all" })}>All topics</button>
              {CATEGORIES.map((c) => (
                <button key={c.id} className="chip" aria-pressed={sel({ kind: "category", id: c.id })} onClick={() => setScope({ kind: "category", id: c.id })}>{c.short}</button>
              ))}
              <button className="chip" aria-pressed={sel({ kind: "weak" })} disabled={!hasWeak} onClick={() => setScope({ kind: "weak" })} title={hasWeak ? undefined : "Answer a few more questions first"}>
                My weak areas
              </button>
            </div>
            {!hasWeak && <p className="mt-2 text-xs text-muted-foreground">“My weak areas” unlocks once you've answered enough questions to spot topics below 70% accuracy.</p>}
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium">Or choose a single topic</span>
              <select className="field" value={scope.kind === "topic" ? scope.id : ""} onChange={(e) => setScope(e.target.value ? { kind: "topic", id: e.target.value } : { kind: "all" })}>
                <option value="">— Any topic —</option>
                {CATEGORIES.map((c) => (
                  <optgroup key={c.id} label={c.short}>
                    {TOPICS.filter((t) => t.category === c.id).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          </fieldset>
          <button className="btn btn-primary w-full sm:w-auto" onClick={() => start()}><ListChecks className="h-4 w-4" /> Start quiz</button>
        </section>
        <aside className="space-y-4">
          <Callout tone="primary">
            <p className="font-semibold">How it works</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-foreground">
              <li>One question at a time.</li>
              <li>Submit to see if you're right and why.</li>
              <li>Missed questions go to My Mistakes.</li>
              <li>Results update your dashboard.</li>
            </ul>
          </Callout>
          <p className="text-xs text-muted-foreground">All questions are original learning questions, not real exam questions.</p>
        </aside>
      </div>
    </>
  );
}

function QuizRun({ session, onRetry, onExit }: { session: Session; onRetry: () => void; onExit: () => void }) {
  const { questions } = session;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<Record<string, { selected: number; correct: boolean }>>({});
  const [finished, setFinished] = useState(false);
  const q = questions[i];
  const submitted = q ? !!results[q.id] : false;

  if (!questions.length) {
    return (
      <Callout tone="amber">
        <p className="font-semibold">No questions available for this selection.</p>
        <button className="btn btn-primary mt-3" onClick={onExit}>Choose another quiz</button>
      </Callout>
    );
  }

  const submit = () => {
    if (picked === null || submitted) return; // guard against repeat submissions
    const correct = picked === q.answer;
    setResults((r) => ({ ...r, [q.id]: { selected: picked, correct } }));
    actions.answer({ sessionId: session.id, questionId: q.id, topicId: q.topicId, category: q.category, selected: picked, correct });
  };
  const next = () => {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      actions.finishQuiz(session.id);
      setFinished(true);
    }
  };

  if (finished) return <Results session={session} results={results} onRetry={onRetry} />;

  const res = results[q.id];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">Question {i + 1} of {questions.length}</p>
        <button className="btn btn-ghost text-sm" onClick={() => { if (Object.keys(results).length) actions.finishQuiz(session.id); onExit(); }}>
          <LogOut className="h-4 w-4" /> Leave quiz
        </button>
      </div>
      <ProgressBar label="Quiz progress" value={((i + (submitted ? 1 : 0)) / questions.length) * 100} />
      {session.note && i === 0 && <div className="mt-4"><Callout>{session.note}</Callout></div>}

      <section className="surface mt-5 p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CategoryBadge category={q.category} />
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{q.difficulty}</span>
        </div>
        <h2 className="text-lg font-bold sm:text-xl">{q.question}</h2>
        <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Answer options">
          {q.options.map((o, idx) => {
            const isCorrect = submitted && idx === q.answer;
            const isWrong = submitted && idx === res?.selected && idx !== q.answer;
            return (
              <button key={idx} role="radio" aria-checked={picked === idx} disabled={submitted} onClick={() => setPicked(idx)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  isCorrect ? "border-success-ink/30 bg-success-soft text-success-ink" : isWrong ? "border-error-ink/30 bg-error-soft text-error-ink" : picked === idx ? "border-primary bg-primary-soft" : "hover:border-primary/50 hover:bg-primary-soft/50"
                }`}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border bg-card text-xs font-bold text-foreground">{String.fromCharCode(65 + idx)}</span>
                <span className="flex-1">{o}</span>
                {isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0" aria-label="Correct answer" />}
                {isWrong && <XCircle className="h-5 w-5 shrink-0" aria-label="Your incorrect answer" />}
              </button>
            );
          })}
        </div>

        {submitted && res && (
          <div className={`mt-5 rounded-xl p-4 text-sm ${res.correct ? "bg-success-soft" : "bg-error-soft"}`} aria-live="polite">
            <p className={`font-bold ${res.correct ? "text-success-ink" : "text-error-ink"}`}>{res.correct ? "Correct — nice work!" : "Not quite — let's learn from it."}</p>
            {!res.correct && q.wrongWhy?.[res.selected] && <p className="mt-2"><strong>Why your answer is wrong:</strong> {q.wrongWhy[res.selected]}</p>}
            <p className="mt-2"><strong>Explanation:</strong> {q.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          {!submitted ? (
            <button className="btn btn-primary" disabled={picked === null} onClick={submit}>Submit Answer</button>
          ) : (
            <button className="btn btn-primary" onClick={next}>{i + 1 < questions.length ? "Next Question" : "See results"} <ArrowRight className="h-4 w-4" /></button>
          )}
        </div>
      </section>
    </div>
  );
}

function Results({ session, results, onRetry }: { session: Session; results: Record<string, { selected: number; correct: boolean }>; onRetry: () => void }) {
  const answered = session.questions.filter((q) => results[q.id]);
  const correct = answered.filter((q) => results[q.id].correct).length;
  const pct = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const byTopic = useMemo(() => {
    const m: Record<string, { a: number; c: number; cat: Category }> = {};
    for (const q of answered) {
      m[q.topicId] ??= { a: 0, c: 0, cat: q.category };
      m[q.topicId].a++;
      if (results[q.id].correct) m[q.topicId].c++;
    }
    return Object.entries(m);
  }, [answered, results]);
  const revise = byTopic.filter(([, v]) => v.c < v.a);
  const msg = pct >= 80 ? "Excellent! You're building strong cloud knowledge." : pct >= 50 ? "Good effort! Review the topics below to grow even more." : "Every question is an opportunity to learn. Review your mistakes and try again!";

  return (
    <div className="mx-auto max-w-3xl">
      <section className="surface p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-soft text-teal"><Trophy className="h-7 w-7" /></span>
        <h1 className="mt-3 text-2xl font-bold">Quiz complete</h1>
        <p className="mt-1 text-muted-foreground">{msg}</p>
        <p className="mt-5 font-display text-5xl font-extrabold text-primary">{pct}%</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-muted p-3"><p className="text-muted-foreground">Answered</p><p className="text-xl font-bold">{answered.length}</p></div>
          <div className="rounded-lg bg-success-soft p-3 text-success-ink"><p>Correct</p><p className="text-xl font-bold">{correct}</p></div>
          <div className="rounded-lg bg-error-soft p-3 text-error-ink"><p>Incorrect</p><p className="text-xl font-bold">{answered.length - correct}</p></div>
        </div>
      </section>

      <section className="surface mt-5 p-5">
        <h2 className="mb-3 font-bold">Performance by topic</h2>
        <ul className="divide-y">
          {byTopic.map(([id, v]) => (
            <li key={id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0">{getTopic(id)?.title ?? id} <span className="text-xs text-muted-foreground">· {categoryLabel(v.cat)}</span></span>
              <span className={`shrink-0 font-semibold ${v.c === v.a ? "text-teal" : "text-error-ink"}`}>{v.c}/{v.a}</span>
            </li>
          ))}
        </ul>
        {revise.length > 0 && (
          <div className="mt-4"><Callout>
            <p className="font-semibold">Topics to revise</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {revise.map(([id]) => <Link key={id} to="/learn" search={{ topic: id }} className="chip">{getTopic(id)?.title ?? id}</Link>)}
            </div>
          </Callout></div>
        )}
      </section>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/mistakes" className="btn btn-outline"><AlertCircle className="h-4 w-4" /> Review Mistakes</Link>
        <button className="btn btn-primary" onClick={onRetry}><RotateCcw className="h-4 w-4" /> Try Again</button>
        <Link to="/" className="btn btn-outline"><Home className="h-4 w-4" /> Return to Dashboard</Link>
      </div>
    </div>
  );
}
