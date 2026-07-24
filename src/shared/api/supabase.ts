import { createClient } from "@supabase/supabase-js";
import type { Book, Problem, Explanation, UserProfile, UserStatus } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── 교재 ─────────────────────────────────────────────

export async function fetchBooks(): Promise<Book[]> {
    const { data, error } = await supabase.from("books").select("*").order("created_at");
    if (error) throw error;
    return data ?? [];
}

export async function insertBook(name: string): Promise<Book> {
    const { data, error } = await supabase.from("books").insert({ name }).select().single();

    if (error) throw error;
    return data;
}

export async function deleteBook(id: string): Promise<void> {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) throw error;
}

// ── 문항 ─────────────────────────────────────────────

export async function fetchProblems(bookId: string): Promise<Problem[]> {
    const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("book_id", bookId)
        .order("page")
        .order("number");
    if (error) throw error;
    return data ?? [];
}

export async function insertProblem(
    bookId: string,
    page: string,
    number: string,
    topic: string,
): Promise<Problem> {
    const { data, error } = await supabase
        .from("problems")
        .insert({ book_id: bookId, page, number, topic })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteProblem(id: string): Promise<void> {
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (error) throw error;
}

// ── 해설 ─────────────────────────────────────────────

export async function fetchExplanation(problemId: string): Promise<Explanation | null> {
    const { data, error } = await supabase
        .from("explanations")
        .select("*")
        .eq("problem_id", problemId)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function upsertExplanation(
    problemId: string,
    fullExplanation: string,
    keyConcepts: string[],
    hintSteps: string[],
): Promise<Explanation> {
    const { data, error } = await supabase
        .from("explanations")
        .upsert(
            {
                problem_id: problemId,
                full_explanation: fullExplanation,
                key_concepts: keyConcepts,
                hint_steps: hintSteps,
            },
            { onConflict: "problem_id" },
        )
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteExplanation(problemId: string): Promise<void> {
    const { error } = await supabase.from("explanations").delete().eq("problem_id", problemId);
    if (error) throw error;
}

// ── 인증 ─────────────────────────────────────────────

export async function signIn(name: string, password: string) {
    const { data: email, error: rpcError } = await supabase.rpc('lookup_email_by_name', { p_name: name });
    if (rpcError || !email) throw new Error('이름을 찾을 수 없어. 다시 확인해봐!');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('비밀번호가 틀렸어!');
    return data;
}

export async function signUp(
    name: string, school: string, grade: string, className: string, age: number, password: string
) {
    const unique = Math.random().toString(36).slice(2, 10);
    const email = `u_${unique}@gomath.internal`;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, school, grade, class_name: className, age } },
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function fetchMyProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function updateMyProfile(fields: {
    name?: string;
    school?: string;
    grade?: string;
    class_name?: string;
}): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인 필요');
    const { error } = await supabase.from('user_profiles').update(fields).eq('id', user.id);
    if (error) throw error;
}

export async function updateMyPassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const { error } = await supabase
        .from("user_profiles")
        .update({ status })
        .eq("id", userId);
    if (error) throw error;
}

// ── 과제 ─────────────────────────────────────────────

export async function fetchAssignments(userId: string): Promise<import('../types').Assignment[]> {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('class_name')
        .eq('id', userId)
        .maybeSingle();

    const userClass = profile?.class_name;

    let query = supabase
        .from('assignments')
        .select('id, due_date, note, class_name, created_at, problems(id, page, number, topic, books(name))')
        .order('due_date', { ascending: true });

    if (userClass) {
        query = query.or(`class_name.is.null,class_name.eq.${userClass}`);
    }

    const [{ data: rows }, { data: completions }] = await Promise.all([
        query,
        supabase.from('assignment_completions').select('assignment_id').eq('user_id', userId),
    ]);
    const doneSet = new Set((completions ?? []).map((c) => c.assignment_id));
    return (rows ?? []).map((r) => ({ ...r, completed: doneSet.has(r.id) })) as unknown as import('../types').Assignment[];
}

export async function fetchAllAssignments(): Promise<Omit<import('../types').Assignment, 'completed'>[]> {
    const { data, error } = await supabase
        .from('assignments')
        .select('id, due_date, note, class_name, created_at, problems(id, book_id, page, number, topic, books(name))')
        .order('due_date', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as Omit<import('../types').Assignment, 'completed'>[];
}

export async function toggleAssignmentDone(assignmentId: string, userId: string, done: boolean): Promise<void> {
    if (done) {
        const { error } = await supabase
            .from('assignment_completions')
            .insert({ assignment_id: assignmentId, user_id: userId });
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('assignment_completions')
            .delete()
            .eq('assignment_id', assignmentId)
            .eq('user_id', userId);
        if (error) throw error;
    }
}

export async function insertAssignment(
    problemId: string,
    dueDate: string | null,
    note: string,
    className: string | null,
): Promise<void> {
    const { error } = await supabase
        .from('assignments')
        .insert({ problem_id: problemId, due_date: dueDate || null, note: note || null, class_name: className || null });
    if (error) throw error;
}

export async function fetchClassNames(): Promise<string[]> {
    const { data } = await supabase
        .from('user_profiles')
        .select('class_name')
        .not('class_name', 'is', null);
    const unique = [...new Set((data ?? []).map((r) => r.class_name).filter(Boolean))];
    return (unique as string[]).sort();
}

export async function updateAssignment(
    id: string,
    problemId: string,
    dueDate: string | null,
    note: string,
    className: string | null,
): Promise<void> {
    const { error } = await supabase
        .from('assignments')
        .update({ problem_id: problemId, due_date: dueDate || null, note: note || null, class_name: className || null })
        .eq('id', id);
    if (error) throw error;
}

export async function deleteAssignment(id: string): Promise<void> {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
}

// ── 과제 완료 현황 ────────────────────────────────────

export type StudentCompletion = {
    id: string;
    name: string | null;
    class_name: string | null;
    completed: boolean;
    completed_at: string | null;
};

export async function fetchAssignmentCompletions(
    assignmentId: string,
    className: string | null,
): Promise<StudentCompletion[]> {
    let studentQuery = supabase
        .from('user_profiles')
        .select('id, name, class_name')
        .eq('role', 'student')
        .eq('status', 'approved')
        .order('class_name')
        .order('name');

    if (className) {
        studentQuery = studentQuery.eq('class_name', className);
    }

    const [{ data: students }, { data: completions }] = await Promise.all([
        studentQuery,
        supabase
            .from('assignment_completions')
            .select('user_id, completed_at')
            .eq('assignment_id', assignmentId),
    ]);

    const doneMap = new Map(
        (completions ?? []).map((c) => [c.user_id, c.completed_at as string]),
    );

    return (students ?? []).map((s) => ({
        ...s,
        completed: doneMap.has(s.id),
        completed_at: doneMap.get(s.id) ?? null,
    }));
}

// ── PDF 일괄 등록 ─────────────────────────────────────

export type ParsedProblem = {
    page: string;
    number: string;
    topic: string;
    full_explanation: string;
    key_concepts: string[];
    hint_steps: string[];
};

export async function parsePdf(file: File): Promise<ParsedProblem[]> {
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
    const path = `uploads/${safeName}`;
    const { error: uploadError } = await supabase.storage
        .from('pdf-uploads')
        .upload(path, file, { contentType: 'application/pdf' });
    if (uploadError) throw uploadError;

    try {
        const { data, error } = await supabase.functions.invoke('parse-pdf', {
            body: { storage_path: path },
        });
        if (error) throw error;
        return data.problems ?? [];
    } finally {
        await supabase.storage.from('pdf-uploads').remove([path]);
    }
}

export async function bulkSaveProblems(
    bookId: string,
    items: ParsedProblem[],
): Promise<{ saved: number; errors: number }> {
    const { data: existing } = await supabase
        .from('problems')
        .select('id, page, number')
        .eq('book_id', bookId);

    const existingMap = new Map(
        (existing ?? []).map((p) => [`${p.page}-${p.number}`, p.id]),
    );

    let saved = 0;
    let errors = 0;

    for (const item of items) {
        try {
            let problemId = existingMap.get(`${item.page}-${item.number}`);

            if (!problemId) {
                const { data: newP, error: pErr } = await supabase
                    .from('problems')
                    .insert({ book_id: bookId, page: item.page, number: item.number, topic: item.topic })
                    .select('id')
                    .single();
                if (pErr || !newP) { errors++; continue; }
                problemId = newP.id;
            }

            const { error: eErr } = await supabase
                .from('explanations')
                .upsert(
                    {
                        problem_id: problemId,
                        full_explanation: item.full_explanation,
                        key_concepts: item.key_concepts,
                        hint_steps: item.hint_steps,
                    },
                    { onConflict: 'problem_id' },
                );
            if (eErr) { errors++; continue; }
            saved++;
        } catch {
            errors++;
        }
    }

    return { saved, errors };
}
