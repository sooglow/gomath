import { createClient } from '@supabase/supabase-js';
import type { Book, Problem, Explanation } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── 교재 ─────────────────────────────────────────────

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function insertBook(name: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

// ── 문항 ─────────────────────────────────────────────

export async function fetchProblems(bookId: string): Promise<Problem[]> {
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('book_id', bookId)
    .order('page')
    .order('number');
  if (error) throw error;
  return data ?? [];
}

export async function insertProblem(
  bookId: string,
  page: string,
  number: string,
  topic: string
): Promise<Problem> {
  const { data, error } = await supabase
    .from('problems')
    .insert({ book_id: bookId, page, number, topic })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProblem(id: string): Promise<void> {
  const { error } = await supabase.from('problems').delete().eq('id', id);
  if (error) throw error;
}

// ── 해설 ─────────────────────────────────────────────

export async function fetchExplanation(problemId: string): Promise<Explanation | null> {
  const { data, error } = await supabase
    .from('explanations')
    .select('*')
    .eq('problem_id', problemId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertExplanation(
  problemId: string,
  fullExplanation: string,
  keyConcepts: string[],
  hintSteps: string[]
): Promise<Explanation> {
  const { data, error } = await supabase
    .from('explanations')
    .upsert(
      {
        problem_id: problemId,
        full_explanation: fullExplanation,
        key_concepts: keyConcepts,
        hint_steps: hintSteps,
      },
      { onConflict: 'problem_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExplanation(problemId: string): Promise<void> {
  const { error } = await supabase
    .from('explanations')
    .delete()
    .eq('problem_id', problemId);
  if (error) throw error;
}
