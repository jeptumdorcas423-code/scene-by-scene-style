import { describe, expect, it } from "vitest";
import { applyAnswer, applyFinishQuiz, defaultState } from "@/lib/store";
import { readiness } from "@/lib/stats";
import { QUESTIONS } from "@/lib/content/questions";
import { FLASHCARDS } from "@/lib/content/flashcards";
import { FAQS } from "@/lib/content/faq";

const ans = (sessionId: string, questionId: string, correct: boolean) => ({ sessionId, questionId, topicId: "iaas", category: "concepts" as const, selected: 0, correct });

describe("rules", () => {
  it("repeated submission of the same question in a quiz is counted once", () => {
    let s = applyAnswer(defaultState(), ans("s1", "q1", true));
    s = applyAnswer(s, ans("s1", "q1", true));
    expect(s.answers).toHaveLength(1);
  });
  it("a wrong answer creates exactly one mistake, even if missed again", () => {
    let s = applyAnswer(defaultState(), ans("s1", "q1", false));
    s = applyAnswer(s, ans("s2", "q1", false));
    expect(s.mistakes).toHaveLength(1);
    expect(s.mistakes[0].count).toBe(2);
  });
  it("quiz result score counts only that quiz", () => {
    let s = applyAnswer(defaultState(), ans("s1", "q1", true));
    s = applyAnswer(s, ans("s1", "q2", false));
    s = applyFinishQuiz(s, "s1");
    expect(s.quizzes[0]).toMatchObject({ total: 2, correct: 1 });
  });
  it("readiness needs 20 answers", () => {
    let s = defaultState();
    for (let i = 0; i < 19; i++) s = applyAnswer(s, ans("s", `x${i}`, true));
    expect(readiness(s).sufficient).toBe(false);
    s = applyAnswer(s, ans("s", "x19", true));
    expect(readiness(s).sufficient).toBe(true);
  });
  it("content minimums are met", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(30);
    expect(FLASHCARDS.length).toBeGreaterThanOrEqual(30);
    expect(FAQS.length).toBeGreaterThanOrEqual(10);
  });
});
