export type TabType = 'home' | 'ai-tutor' | 'notes' | 'profile' | 'admin';

export type MessageType = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  hasAudio?: boolean;
  imageUrl?: string;
  timestamp: Date;
};

export type NoteType = {
  id: string;
  book: string;
  page: string;
  problem: string;
  date: string;
  tag: string;
  solved: boolean;
  hint: string;
};

// ── DB 타입 ──────────────────────────────────────────

export type Book = {
  id: string;
  name: string;
  created_at: string;
};

export type Problem = {
  id: string;
  book_id: string;
  page: string;
  number: string;
  topic: string | null;
  created_at: string;
};

export type Explanation = {
  id: string;
  problem_id: string;
  full_explanation: string;
  key_concepts: string[] | null;
  hint_steps: string[] | null;
  created_at: string;
  updated_at: string;
};

// problems 조회 시 explanations를 join한 타입
export type ProblemWithExplanation = Problem & {
  explanations: Explanation | null;
};
