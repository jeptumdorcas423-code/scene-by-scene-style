import { QUESTIONS } from "./content/questions";
import { getTopic } from "./content/topics";
import type { Category, Question } from "./content/types";

export const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export interface PoolOptions {
  topic?: string;
  category?: Category;
  weak?: Category[];
  weakTopics?: string[];
  exclude?: string;
}

/** Builds a question pool; falls back gracefully when a filter has no questions. */
export function buildPool(o: PoolOptions): { pool: Question[]; note?: string } {
  const base = QUESTIONS.filter((q) => q.id !== o.exclude);
  if (o.topic) {
    const byTopic = base.filter((q) => q.topicId === o.topic);
    if (byTopic.length) return { pool: byTopic };
    const t = getTopic(o.topic);
    if (t) {
      const cat = base.filter((q) => q.category === t.category);
      return { pool: cat, note: `There are no dedicated questions for “${t.title}” yet, so here are questions from the same skill area.` };
    }
  }
  if (o.weak || o.weakTopics) {
    const pool = base.filter((q) => o.weakTopics?.includes(q.topicId) || o.weak?.includes(q.category));
    if (pool.length) return { pool };
    return { pool: base, note: "Not enough history to find weak areas yet—here's a mixed quiz instead." };
  }
  if (o.category) {
    const cat = base.filter((q) => q.category === o.category);
    if (cat.length) return { pool: cat };
    return { pool: base, note: "No questions in that category yet—showing all topics." };
  }
  return { pool: base };
}
