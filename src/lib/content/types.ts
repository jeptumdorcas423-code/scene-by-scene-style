export type Category = "concepts" | "architecture" | "management";

export const CATEGORIES: { id: Category; label: string; short: string }[] = [
  { id: "concepts", label: "Describe cloud concepts", short: "Cloud concepts" },
  { id: "architecture", label: "Describe Azure architecture and services", short: "Architecture & services" },
  { id: "management", label: "Describe Azure management and governance", short: "Management & governance" },
];

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.short ?? c;

export interface KnowledgeCheck {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  category: Category;
  definition: string;
  explanation: string;
  analogy: string;
  facts: string[];
  misconception?: string;
  check: KnowledgeCheck;
}

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: string;
  category: Category;
  topicId: string;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  /** Why specific wrong options are wrong, keyed by option index. */
  wrongWhy?: Record<number, string>;
  analogy?: string;
  keyFact: string;
}

export interface Flashcard {
  id: string;
  category: Category;
  topicId: string;
  front: string;
  back: string;
  example?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: Category;
  topicIds: string[];
  keywords: string[];
}
