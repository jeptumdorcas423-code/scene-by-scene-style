import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Flame, Layers, ListChecks, Target, ClipboardCheck, AlertCircle, CalendarDays, Gauge, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { useAppState } from "@/lib/store";
import { CATEGORIES } from "@/lib/content/types";
import { cardCounts, categoryProgress, overall, recommendations, streak } from "@/lib/stats";
import { Callout, EmptyState, PageHeader, ProgressBar, StatCard } from "@/components/kit";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead("Dashboard", "Your AZ-900 learning dashboard: progress, accuracy, streaks and personalised next steps."),
  component: Dashboard,
});

const TIPS = [
  "Remember: you are ALWAYS responsible for your data, devices, accounts and identities—whatever the service model.",
  "Availability zones protect you within a region; region pairs protect you across regions.",
  "Azure Policy controls what resources look like. Resource locks stop accidental deletion.",
  "Pricing Calculator = estimate before. Cost Management = actual spend after.",
  "Elasticity is automatic. Scalability can be manual.",
  "ExpressRoute never uses the public internet. VPN Gateway does—but encrypted.",
  "Service Health is about Azure's health. Azure Monitor is about your resources.",
];
const ENCOURAGE = ["Every question is an opportunity to learn.", "Small steps lead to big progress.", "Keep going! You're building your cloud knowledge."];

function Dashboard() {
  const s = useAppState();
  const o = overall(s);
  const cards = cardCounts(s);
  const done = s.tasks.filter((t) => t.done).length;
  const st = streak(s);
  const recs = recommendations(s);
  const dayIdx = Math.floor(Date.now() / 86400000);
  const tip = TIPS[dayIdx % TIPS.length];
  const isNew = o.answered === 0 && cards.reviewed === 0 && s.tasks.length === 0;

  return (
    <>
      <PageHeader
        title="Welcome to Azure Buddy! 👋"
        subtitle="Your journey to understanding the cloud starts here. Learn, practise, and grow your confidence one step at a time."
      />

      {isNew ? (
        <EmptyState icon={Sparkles} title="Let's start your first step" body="You haven't recorded any activity yet. Read a short lesson or try a five-question quiz—your progress will appear here automatically.">
          <Link to="/learn" className="btn btn-primary"><BookOpen className="h-4 w-4" /> Start your first lesson</Link>
          <Link to="/quiz" className="btn btn-outline"><ListChecks className="h-4 w-4" /> Take a quick quiz</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatCard icon={ListChecks} label="Questions answered" value={o.answered} />
          <StatCard icon={CheckCircle2} label="Correct answers" value={o.correct} tone="teal" />
          <StatCard icon={Target} label="Quiz accuracy" value={o.answered ? `${o.accuracy}%` : "—"} />
          <StatCard icon={Layers} label="Flashcards reviewed" value={`${cards.reviewed}/${cards.total}`} tone="teal" />
          <StatCard icon={ClipboardCheck} label="Study tasks completed" value={done} />
          <StatCard icon={Flame} label="Learning streak" value={st ? `${st} day${st > 1 ? "s" : ""}` : "—"} hint={st ? undefined : "Study today to start one"} tone="amber" />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="surface p-5 lg:col-span-3" aria-labelledby="progress-h">
          <h2 id="progress-h" className="text-lg font-bold">Learning progress</h2>
          <p className="mb-5 text-sm text-muted-foreground">Based on topics you've practised and your quiz accuracy in each skill area.</p>
          <div className="space-y-5">
            {CATEGORIES.map((c, i) => (
              <ProgressBar key={c.id} label={c.label} value={categoryProgress(s, c.id)} tone={i === 1 ? "teal" : "primary"} />
            ))}
          </div>
        </section>

        <section className="surface p-5 lg:col-span-2" aria-labelledby="next-h">
          <h2 id="next-h" className="text-lg font-bold">Recommended next steps</h2>
          {recs.length ? (
            <ul className="mt-4 space-y-3">
              {recs.slice(0, 4).map((r, i) => (
                <li key={i} className="rounded-lg bg-amber-soft p-3 text-sm">
                  <p className="text-amber-ink">{r.text}</p>
                  <Link to={r.to} search={r.search as never} className="mt-1.5 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                    {r.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {o.answered ? "Great work—no weak spots detected yet. Try an extended quiz to keep improving." : "Complete a quiz and we'll suggest what to study next based on your results."}
            </p>
          )}
        </section>
      </div>

      <section className="mt-8" aria-labelledby="qa-h">
        <h2 id="qa-h" className="mb-3 text-lg font-bold">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { to: "/learn", label: "Continue Learning", icon: BookOpen },
            { to: "/quiz", label: "Start a Quiz", icon: ListChecks },
            { to: "/flashcards", label: "Study Flashcards", icon: Layers },
            { to: "/mistakes", label: "Review My Mistakes", icon: AlertCircle },
            { to: "/planner", label: "Open Study Planner", icon: CalendarDays },
            { to: "/readiness", label: "Check Exam Readiness", icon: Gauge },
          ].map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="surface hover-lift flex items-center gap-3 p-4 text-sm font-semibold">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="h-4.5 w-4.5" /></span>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Callout tone="primary">
          <p className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4" /> Daily learning tip</p>
          <p className="mt-1 text-foreground">{tip}</p>
        </Callout>
        <Callout tone="teal">
          <p className="font-semibold">{ENCOURAGE[dayIdx % ENCOURAGE.length]}</p>
          <p className="mt-1 text-foreground">Consistency beats cramming—even 15 minutes a day adds up.</p>
        </Callout>
      </div>
    </>
  );
}
