import { CATEGORIES, type Category } from "./content/types";
import { TOPICS, getTopic } from "./content/topics";
import { FLASHCARDS } from "./content/flashcards";
import { localDateKey, parseLocalDate, type AppState } from "./store";

export const MIN_ANSWERS_FOR_READINESS = 20;
export const MIN_ANSWERS_FOR_WEAK = 3;

export interface Perf {
  answered: number;
  correct: number;
  accuracy: number; // 0-100
}
const perf = (answered: number, correct: number): Perf => ({ answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : 0 });

export function overall(s: AppState): Perf {
  return perf(s.answers.length, s.answers.filter((a) => a.correct).length);
}

export function byCategory(s: AppState): Record<Category, Perf> {
  const out = {} as Record<Category, Perf>;
  for (const c of CATEGORIES) {
    const list = s.answers.filter((a) => a.category === c.id);
    out[c.id] = perf(list.length, list.filter((a) => a.correct).length);
  }
  return out;
}

export function byTopic(s: AppState): Record<string, Perf> {
  const map: Record<string, { a: number; c: number }> = {};
  for (const a of s.answers) {
    map[a.topicId] ??= { a: 0, c: 0 };
    map[a.topicId].a++;
    if (a.correct) map[a.topicId].c++;
  }
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, perf(v.a, v.c)]));
}

/** Topics with enough attempts and accuracy below 70%, weakest first. */
export function weakTopics(s: AppState) {
  return Object.entries(byTopic(s))
    .filter(([, p]) => p.answered >= 1 && p.accuracy < 70)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .map(([id, p]) => ({ topic: getTopic(id)!, perf: p }))
    .filter((x) => x.topic);
}

export function weakCategories(s: AppState): Category[] {
  const bc = byCategory(s);
  return CATEGORIES.filter((c) => bc[c.id].answered >= MIN_ANSWERS_FOR_WEAK && bc[c.id].accuracy < 70)
    .sort((a, b) => bc[a.id].accuracy - bc[b.id].accuracy)
    .map((c) => c.id);
}

/** Category progress: blends topic coverage with accuracy, so it reflects real activity. */
export function categoryProgress(s: AppState, c: Category): number {
  const topics = TOPICS.filter((t) => t.category === c);
  const answeredTopics = new Set(s.answers.filter((a) => a.category === c).map((a) => a.topicId));
  const cardTopics = new Set(FLASHCARDS.filter((f) => f.category === c && s.cards[f.id] === "know").map((f) => f.topicId));
  const touched = topics.filter((t) => answeredTopics.has(t.id) || cardTopics.has(t.id)).length;
  const coverage = topics.length ? touched / topics.length : 0;
  const acc = byCategory(s)[c];
  const accuracy = acc.answered ? acc.correct / acc.answered : 0;
  return Math.round((coverage * 0.5 + accuracy * 0.5 * Math.min(1, acc.answered / 5)) * 100);
}

export function streak(s: AppState, today = new Date()): number {
  const days = new Set(s.activityDays);
  let count = 0;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(localDateKey(d))) d.setDate(d.getDate() - 1); // streak still alive if active yesterday
  while (days.has(localDateKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function cardCounts(s: AppState) {
  const vals = Object.values(s.cards);
  return { know: vals.filter((v) => v === "know").length, practice: vals.filter((v) => v === "practice").length, reviewed: s.cardsReviewed.length, total: FLASHCARDS.length };
}

export interface Readiness {
  sufficient: boolean;
  score: number;
  parts: { label: string; weight: number; value: number }[];
}

/**
 * Educational indicator only:
 * 60% quiz accuracy · 15% category coverage · 15% flashcards known · 10% mistakes reviewed.
 */
export function readiness(s: AppState): Readiness {
  const o = overall(s);
  const bc = byCategory(s);
  const coverage = CATEGORIES.filter((c) => bc[c.id].answered >= MIN_ANSWERS_FOR_WEAK).length / CATEGORIES.length;
  const cards = cardCounts(s);
  const known = cards.know / cards.total;
  const reviewed = s.mistakes.length ? s.mistakes.filter((m) => m.reviewed).length / s.mistakes.length : 1;
  const parts = [
    { label: "Quiz accuracy", weight: 60, value: o.answered ? o.correct / o.answered : 0 },
    { label: "Skill-area coverage", weight: 15, value: coverage },
    { label: "Flashcards known", weight: 15, value: known },
    { label: "Mistakes reviewed", weight: 10, value: reviewed },
  ];
  const score = Math.round(parts.reduce((sum, p) => sum + p.weight * p.value, 0));
  return { sufficient: o.answered >= MIN_ANSWERS_FOR_READINESS, score, parts };
}

export interface Recommendation {
  text: string;
  to: "/learn" | "/quiz" | "/flashcards" | "/mistakes" | "/planner";
  search?: Record<string, string>;
  cta: string;
}

export function recommendations(s: AppState): Recommendation[] {
  const recs: Recommendation[] = [];
  for (const w of weakTopics(s).slice(0, 2)) {
    recs.push({ text: `Review “${w.topic.title}” — ${w.perf.accuracy}% accuracy so far.`, to: "/learn", search: { topic: w.topic.id }, cta: "Open lesson" });
  }
  const wc = weakCategories(s)[0];
  if (wc) recs.push({ text: `Practise questions on ${CATEGORIES.find((c) => c.id === wc)!.short.toLowerCase()}.`, to: "/quiz", search: { category: wc }, cta: "Start quiz" });
  const unrev = s.mistakes.filter((m) => !m.reviewed).length;
  if (unrev) recs.push({ text: `You have ${unrev} missed question${unrev > 1 ? "s" : ""} to review.`, to: "/mistakes", cta: "Review mistakes" });
  const practice = cardCounts(s).practice;
  if (practice) recs.push({ text: `Revisit ${practice} flashcard${practice > 1 ? "s" : ""} marked “Needs Practice”.`, to: "/flashcards", search: { mode: "difficult" }, cta: "Study cards" });
  const today = localDateKey();
  const pending = s.tasks.filter((t) => !t.done && t.date <= today).length;
  if (pending) recs.push({ text: `${pending} study task${pending > 1 ? "s are" : " is"} due.`, to: "/planner", cta: "Open planner" });
  const bc = byCategory(s);
  const untried = CATEGORIES.find((c) => bc[c.id].answered === 0);
  if (untried && s.answers.length) recs.push({ text: `Try your first quiz on ${untried.short.toLowerCase()}.`, to: "/quiz", search: { category: untried.id }, cta: "Start quiz" });
  return recs;
}

export function daysUntil(key: string, from = new Date()): number | null {
  if (!key) return null;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((parseLocalDate(key).getTime() - a.getTime()) / 86400000);
}
