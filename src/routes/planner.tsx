import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { actions, localDateKey, parseLocalDate, useAppState, type Task } from "@/lib/store";
import { CATEGORIES, type Category } from "@/lib/content/types";
import { TOPICS } from "@/lib/content/topics";
import { byTopic, daysUntil, weakCategories } from "@/lib/stats";
import { Callout, EmptyState, PageHeader, ProgressBar } from "@/components/kit";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/planner")({
  head: () => pageHead("Study Planner", "Plan your AZ-900 revision with tasks, daily goals and a generated study schedule."),
  component: Planner,
});

const addDays = (key: string, n: number) => {
  const d = parseLocalDate(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
};
const fmt = (key: string) => parseLocalDate(key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

/** Builds a simple schedule; weaker categories and untried topics come first. */
export function generatePlan(focus: Category[], weak: Category[], practised: Set<string>, start: string, days: number) {
  const cats = [...focus].sort((a, b) => Number(weak.includes(b)) - Number(weak.includes(a)));
  const topics = cats.flatMap((c) => TOPICS.filter((t) => t.category === c)).sort((a, b) => Number(practised.has(a.id)) - Number(practised.has(b.id)));
  const total = Math.max(1, Math.min(days, 28));
  const out: Omit<Task, "id" | "done">[] = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(start, i);
    if (i % 7 === 6) {
      out.push({ title: "Take a mixed-topic quiz", date, minutes: 20 });
      out.push({ title: "Revisit missed questions in My Mistakes", date, minutes: 10 });
      continue;
    }
    const t = topics[i % Math.max(1, topics.length)];
    if (!t) continue;
    out.push({ title: `Read lesson: ${t.title}`, date, minutes: 15, category: t.category });
    out.push({ title: i % 2 ? "Review difficult flashcards" : `Practice quiz: ${CATEGORIES.find((c) => c.id === t.category)!.short}`, date, minutes: 10, category: t.category });
  }
  return out;
}

function Planner() {
  const s = useAppState();
  const today = localDateKey();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(20);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Task>>({});
  const [msg, setMsg] = useState("");

  const left = daysUntil(s.settings.targetDate);
  const upcoming = s.tasks.filter((t) => !t.done).sort((a, b) => a.date.localeCompare(b.date));
  const completed = s.tasks.filter((t) => t.done).sort((a, b) => (b.completedOn ?? "").localeCompare(a.completedOn ?? ""));
  const todayMin = s.tasks.filter((t) => t.done && t.completedOn === today).reduce((n, t) => n + t.minutes, 0);
  const weekStart = addDays(today, -6);
  const weekMin = s.tasks.filter((t) => t.done && t.completedOn && t.completedOn >= weekStart).reduce((n, t) => n + t.minutes, 0);
  const groups = upcoming.reduce<Record<string, Task[]>>((g, t) => ((g[t.date] ??= []).push(t), g), {});

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.addTask({ title: title.trim(), date, minutes: Math.max(5, minutes) });
    setTitle("");
  };
  const generate = () => {
    if (!s.settings.focus.length) return setMsg("Select at least one topic area first.");
    const days = left && left > 0 ? left : 14;
    const plan = generatePlan(s.settings.focus, weakCategories(s), new Set(Object.keys(byTopic(s))), today, days);
    actions.addTasks(plan);
    setMsg(`Added ${plan.length} tasks over ${Math.min(days, 28)} days${weakCategories(s).length ? ", starting with your weaker areas" : ""}.`);
  };
  const toggleFocus = (c: Category) => {
    const f = s.settings.focus;
    actions.updateSettings({ focus: f.includes(c) ? f.filter((x) => x !== c) : [...f, c] });
  };

  return (
    <>
      <PageHeader title="Study Planner" subtitle="Set a target, plan your tasks, and track your daily and weekly goals." />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface space-y-4 p-5">
          <h2 className="font-bold">Your goals</h2>
          <label className="block text-sm"><span className="mb-1 block font-medium">Target study date</span>
            <input type="date" className="field" min={today} value={s.settings.targetDate} onChange={(e) => actions.updateSettings({ targetDate: e.target.value })} />
          </label>
          {left !== null && <p className="text-sm text-muted-foreground">{left > 0 ? `${left} days to go` : left === 0 ? "Target date is today!" : "Target date has passed"}</p>}
          <label className="block text-sm"><span className="mb-1 block font-medium">Daily goal (minutes)</span>
            <input type="number" min={5} max={480} className="field" value={s.settings.dailyGoal} onChange={(e) => actions.updateSettings({ dailyGoal: Math.max(5, Number(e.target.value) || 5) })} />
          </label>
          <ProgressBar label={`Today: ${todayMin}/${s.settings.dailyGoal} min`} value={(todayMin / s.settings.dailyGoal) * 100} tone="teal" />
          <ProgressBar label={`This week: ${weekMin}/${s.settings.dailyGoal * 7} min`} value={(weekMin / (s.settings.dailyGoal * 7)) * 100} />
          <div>
            <p className="mb-2 text-sm font-medium">Topics to study</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => <button key={c.id} className="chip" aria-pressed={s.settings.focus.includes(c.id)} onClick={() => toggleFocus(c.id)}>{c.short}</button>)}
            </div>
          </div>
          <button className="btn btn-primary w-full" onClick={generate}><Sparkles className="h-4 w-4" /> Generate Study Plan</button>
          {msg && <Callout tone="teal">{msg}</Callout>}
        </section>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={add} className="surface grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
            <label className="text-sm"><span className="mb-1 block font-medium">New task</span><input className="field" placeholder="e.g. Read about storage redundancy" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Date</span><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Minutes</span><input type="number" min={5} className="field w-24" value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 5)} /></label>
            <button className="btn btn-primary" disabled={!title.trim()}><Plus className="h-4 w-4" /> Add</button>
          </form>

          <section>
            <h2 className="mb-3 font-bold">Upcoming tasks</h2>
            {!upcoming.length ? (
              <EmptyState icon={CalendarDays} title="No upcoming tasks" body="Add a task above or generate a study plan to get a suggested schedule." />
            ) : (
              <div className="space-y-4">
                {Object.entries(groups).map(([d, list]) => (
                  <div key={d} className="surface p-4">
                    <p className={`mb-2 text-sm font-semibold ${d < today ? "text-amber-ink" : d === today ? "text-primary" : "text-muted-foreground"}`}>{d === today ? "Today" : fmt(d)}{d < today && " · overdue"}</p>
                    <ul className="divide-y">
                      {list.map((t) => editing === t.id ? (
                        <li key={t.id} className="grid gap-2 py-2 sm:grid-cols-[1fr_auto_auto_auto]">
                          <input className="field" aria-label="Task title" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                          <input type="date" className="field" aria-label="Task date" value={draft.date ?? ""} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                          <input type="number" className="field w-24" aria-label="Minutes" value={draft.minutes ?? 0} onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) || 5 })} />
                          <div className="flex gap-1">
                            <button className="btn btn-teal p-2" aria-label="Save" onClick={() => { actions.updateTask(t.id, draft); setEditing(null); }}><Check className="h-4 w-4" /></button>
                            <button className="btn btn-ghost p-2" aria-label="Cancel" onClick={() => setEditing(null)}><X className="h-4 w-4" /></button>
                          </div>
                        </li>
                      ) : (
                        <li key={t.id} className="flex items-center gap-3 py-2">
                          <input type="checkbox" className="h-4 w-4 accent-[var(--color-teal)]" aria-label={`Complete ${t.title}`} checked={t.done} onChange={() => actions.toggleTask(t.id)} />
                          <span className="min-w-0 flex-1 text-sm">{t.title} <span className="text-xs text-muted-foreground">· {t.minutes} min</span></span>
                          <button className="btn btn-ghost p-2" aria-label="Edit task" onClick={() => { setEditing(t.id); setDraft(t); }}><Pencil className="h-4 w-4" /></button>
                          <button className="btn btn-ghost p-2" aria-label="Delete task" onClick={() => actions.deleteTask(t.id)}><Trash2 className="h-4 w-4" /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="surface p-4">
              <h2 className="mb-2 font-bold">Completed ({completed.length})</h2>
              <ul className="divide-y">
                {completed.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--color-teal)]" aria-label={`Mark ${t.title} as not done`} checked onChange={() => actions.toggleTask(t.id)} />
                    <span className="flex-1 text-muted-foreground line-through">{t.title}</span>
                    <button className="btn btn-ghost p-2" aria-label="Delete task" onClick={() => actions.deleteTask(t.id)}><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
