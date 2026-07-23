// @ts-nocheck — Deno Edge Function (npm: imports and Deno global are Deno-only)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Explanation {
  full_explanation: string;
  key_concepts: string[] | null;
  hint_steps: string[] | null;
}

function buildInstruction(explanation: Explanation | null): string {
  const base = `너는 친절한 수학 선생님이야.
학생이 문제나 풀이 사진을 보내면, 속으로 단계별 풀이 과정을 끝까지 생각해라. (절대 출력하지 말 것)
[최종 지시] 정답과 전체 풀이는 절대 유출하지 말고, 학생이 스스로 다음 단계를 생각할 수 있는 결정적인 힌트 1~2문장만 출력해라.
반드시 한국어로, 친근하고 따뜻한 반말 말투로 답해라.
[형식 지시] 수식은 LaTeX($, $$) 없이 일반 텍스트로 써라. 예: x=1, 4x+y=-7, x²+y² 처럼 표현해라.`;

  if (!explanation) return base;

  const concepts = explanation.key_concepts?.join(', ') ?? '';
  const steps = explanation.hint_steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') ?? '';

  return `${base}

[교사가 사전에 입력한 해설 — 참고 전용, 절대 그대로 출력하지 말 것]
${explanation.full_explanation}
${concepts ? `\n핵심 개념: ${concepts}` : ''}
${steps ? `\n단계별 힌트 가이드:\n${steps}` : ''}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { problem_id, user_id, message_type, image_base64, image_mime_type, user_message } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. 문제 + 교재 + 해설 조회
    const { data: problem } = await supabase
      .from('problems')
      .select('*, books(name), explanations(*)')
      .eq('id', problem_id)
      .single();

    const explanation: Explanation | null = problem?.explanations?.[0] ?? null;
    const bookName: string = problem?.books?.name ?? '';
    const problemLabel = problem ? `${problem.page}페이지 ${problem.number}번` : '';

    // 2. Gemini 호출
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: buildInstruction(explanation),
      generationConfig: { temperature: 0 },
    });

    let aiResponse = '';
    let imagePath: string | null = null;

    if (message_type === 'image' && image_base64) {
      const explanationRef = explanation
        ? `\n\n[교사 해설 요약 — 올바른 풀이 흐름]\n${explanation.full_explanation}${
            explanation.hint_steps?.length
              ? '\n\n올바른 단계 순서:\n' + explanation.hint_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
              : ''
          }`
        : '';

      const result = await model.generateContent([
        { inlineData: { data: image_base64, mimeType: image_mime_type || 'image/jpeg' } },
        `교재: ${bookName} / 문항: ${problemLabel}${explanationRef}

[학생 풀이 분석 순서]
1. 위 교사 해설의 올바른 풀이 흐름을 머릿속에 먼저 파악해
2. 사진 속 학생의 풀이를 단계별로 읽고, 교사 해설의 흐름과 비교해
3. 학생이 어디까지 맞게 풀었는지, 어느 단계에서 처음 벗어났는지 찾아봐

[힌트 출력 규칙]
- 맞게 푼 부분은 한 문장으로 짧게 칭찬해
- 처음 틀렸거나 막힌 지점에 대해서만 다음 단계 힌트를 1~2문장으로 줘
- 교사 해설의 내용을 그대로 알려주거나 정답을 유출하지 마`,
      ]);
      aiResponse = result.response.text();

      // 3. 사진 Storage 업로드
      const imageBuffer = Uint8Array.from(atob(image_base64), (c) => c.charCodeAt(0));
      const fileName = `${user_id ?? 'unknown'}/${problem_id}_${Date.now()}.jpg`;
      const { data: uploadData } = await supabase.storage
        .from('student-photos')
        .upload(fileName, imageBuffer, { contentType: 'image/jpeg' });
      imagePath = uploadData?.path ?? null;

    } else {
      const explanationRef = explanation
        ? `\n\n[교사 해설 참고]\n${explanation.full_explanation}${
            explanation.hint_steps?.length
              ? '\n단계: ' + explanation.hint_steps.map((s, i) => `${i + 1}. ${s}`).join(' / ')
              : ''
          }`
        : '';
      const result = await model.generateContent(
        `교재: ${bookName} / 문항: ${problemLabel}${explanationRef}\n학생 질문: "${user_message}"\n\n[힌트 출력 규칙] 정답이나 전체 풀이는 절대 알려주지 말고, 학생이 스스로 생각할 수 있는 힌트 1~2문장만 줘.`
      );
      aiResponse = result.response.text();
    }

    // 4. chat_logs 저장
    await supabase.from('chat_logs').insert({
      problem_id,
      user_id,
      message_type,
      image_path: imagePath,
      user_message: message_type === 'text' ? user_message : null,
      ai_response: aiResponse,
    });

    return new Response(JSON.stringify({ hint: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
