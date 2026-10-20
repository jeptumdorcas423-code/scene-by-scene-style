import { useSyncExternalStore } from "react";
import type { Category } from "./content/types";

export const STORAGE_KEY = "azure-buddy:v1";

export interface AnswerRecord {
  key: string; // sessionId:questionId — guarantees one record per question per quiz
  questionId: string;
  topicId: string;
  category: Category;
  selected: number;
  correct: boolean;
  date: string; // ISO
}
export interface QuizRecord {
  id: string;
  date: string;
  total: number;
  correct: number;
}
export interface MistakeRecord {
  questionId: string;
  selected: number;
  date: string;
  reviewed: boolean;
  count: number;
}
export type CardStatus = "know" | "practice";
export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD local
  minutes: number;
  done: boolean;
  completedOn?: string;
  category?: Category;
}
export interface Settings {
  dailyGoal: number;
  targetDate: string;
  focus: Category[];
}
export interface AppState {
  answers: AnswerRecord[];
  quizzes: QuizRecord[];
  mistakes: MistakeRecord[];
  cards: Record<string, CardStatus>;
  cardsReviewed: string[];
  tasks: Task[];
  settings: Settings;
  activityDays: string[];
}

export const defaultState = (): AppState => ({
  answers: [],
  quizzes: [],
  mistakes: [],
  cards: {},
  cardsReviewed: [],
  tasks: [],
  settings: { dailyGoal: 30, targetDate: "", focus: ["concepts", "architecture", "management"] },
  activityDays: [],
});

export const localDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const parseLocalDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function sanitize(raw: unknown): AppState {
  const d = defaultState();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<AppState>;
  const s = (r.settings ?? {}) as Partial<Settings>;
  return {
    answers: arr<AnswerRecord>(r.answers).filter((a) => a && typeof a.key === "string"),
    quizzes: arr<QuizRecord>(r.quizzes),
    mistakes: arr<MistakeRecord>(r.mistakes).filter((m) => m && typeof m.questionId === "string"),
    cards: r.cards && typeof r.cards === "object" ? r.cards : {},
    cardsReviewed: arr<string>(r.cardsReviewed),
    tasks: arr<Task>(r.tasks).filter((t) => t && typeof t.id === "string"),
    settings: {
      dailyGoal: typeof s.dailyGoal === "number" && s.dailyGoal > 0 ? s.dailyGoal : d.settings.dailyGoal,
      targetDate: typeof s.targetDate === "string" ? s.targetDate : "",
      focus: arr<Category>(s.focus).length ? arr<Category>(s.focus) : d.settings.focus,
    },
    activityDays: arr<string>(r.activityDays),
  };
}

let state: AppState = defaultState();
let loaded = false;
const listeners = new Set<() => void>();
const SERVER = defaultState();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = raw ? sanitize(JSON.parse(raw)) : defaultState();
  } catch {
    state = defaultState();
  }
}

function save() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

function set(updater: (s: AppState) => AppState, activity = false) {
  load();
  let next = updater(state);
  if (activity) {
    const today = localDateKey();
    if (!next.activityDays.includes(today)) next = { ...next, activityDays: [...next.activityDays, today] };
  }
  state = next;
  save();
  listeners.forEach((l) => l());
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => SERVER,
  );
}

/* ---------- pure reducers (exported for tests) ---------- */

export function applyAnswer(
  s: AppState,
  a: { sessionId: string; questionId: string; topicId: string; category: Category; selected: number; correct: boolean },
): AppState {
  const key = `${a.sessionId}:${a.questionId}`;
  if (s.answers.some((x) => x.key === key)) return s; // repeated submission ignored
  const date = new Date().toISOString();
  const answers = [...s.answers, { key, questionId: a.questionId, topicId: a.topicId, category: a.category, selected: a.selected, correct: a.correct, date }];
  let mistakes = s.mistakes;
  if (!a.correct) {
    const existing = mistakes.find((m) => m.questionId === a.questionId);
    mistakes = existing
      ? mistakes.map((m) => (m.questionId === a.questionId ? { ...m, selected: a.selected, date, reviewed: false, count: m.count + 1 } : m))
      : [...mistakes, { questionId: a.questionId, selected: a.selected, date, reviewed: false, count: 1 }];
  }
  return { ...s, answers, mistakes };
}

export function applyFinishQuiz(s: AppState, sessionId: string): AppState {
  if (s.quizzes.some((q) => q.id === sessionId)) return s;
  const mine = s.answers.filter((a) => a.key.startsWith(sessionId + ":"));
  if (!mine.length) return s;
  return { ...s, quizzes: [...s.quizzes, { id: sessionId, date: new Date().toISOString(), total: mine.length, correct: mine.filter((a) => a.correct).length }] };
}

/* ---------- actions ---------- */

export const actions = {
  answer: (a: Parameters<typeof applyAnswer>[1]) => set((s) => applyAnswer(s, a), true),
  finishQuiz: (sessionId: string) => set((s) => applyFinishQuiz(s, sessionId)),
  setCard: (id: string, status: CardStatus) =>
    set((s) => ({ ...s, cards: { ...s.cards, [id]: status }, cardsReviewed: s.cardsReviewed.includes(id) ? s.cardsReviewed : [...s.cardsReviewed, id] }), true),
  viewCard: (id: string) =>
    set((s) => (s.cardsReviewed.includes(id) ? s : { ...s, cardsReviewed: [...s.cardsReviewed, id] }), true),
  markMistakeReviewed: (questionId: string, reviewed = true) =>
    set((s) => ({ ...s, mistakes: s.mistakes.map((m) => (m.questionId === questionId ? { ...m, reviewed } : m)) }), true),
  addTask: (t: Omit<Task, "id" | "done">) => set((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: uid(), done: false }] })),
  addTasks: (list: Omit<Task, "id" | "done">[]) => set((s) => ({ ...s, tasks: [...s.tasks, ...list.map((t) => ({ ...t, id: uid(), done: false }))] })),
  updateTask: (id: string, patch: Partial<Task>) => set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  toggleTask: (id: string) =>
    set(
      (s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done, completedOn: !t.done ? localDateKey() : undefined } : t)),
      }),
      true,
    ),
  deleteTask: (id: string) => set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
  updateSettings: (patch: Partial<Settings>) => set((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
  reset: () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    state = defaultState();
    listeners.forEach((l) => l());
  },
};
