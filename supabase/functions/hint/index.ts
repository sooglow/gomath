// @ts-nocheck — Deno Edge Function (npm: imports and Deno global are Deno-only)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

async function uploadToGeminiFiles(pdfBytes: ArrayBuffer, apiKey: string): Promise<string> {
  const boundary = 'boundary' + Date.now();
  const metaPart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `{"file":{"display_name":"solution.pdf"}}\r\n` +
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`
  );
  const endPart = new TextEncoder().encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(metaPart.byteLength + pdfBytes.byteLength + endPart.byteLength);
  body.set(metaPart, 0);
  body.set(new Uint8Array(pdfBytes), metaPart.byteLength);
  body.set(endPart, metaPart.byteLength + pdfBytes.byteLength);

  // 5MB 이상이면 resumable upload
  if (pdfBytes.byteLength > 5 * 1024 * 1024) {
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/resumable/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': String(pdfBytes.byteLength),
          'X-Goog-Upload-Header-Content-Type': 'application/pdf',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: { display_name: 'solution.pdf' } }),
      }
    );
    if (!initRes.ok) throw new Error(`Gemini init (${initRes.status}): ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) throw new Error('Upload URL 없음');
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Length': String(pdfBytes.byteLength), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
      body: pdfBytes,
    });
    if (!uploadRes.ok) throw new Error(`Gemini upload (${uploadRes.status}): ${await uploadRes.text()}`);
    const { file } = await uploadRes.json();
    return file.uri;
  } else {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
    );
    if (!res.ok) throw new Error(`Gemini upload (${res.status}): ${await res.text()}`);
    const { file } = await res.json();
    return file.uri;
  }
}

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
      .select('*, books(id, name), explanations(*)')
      .eq('id', problem_id)
      .single();

    const explanation: Explanation | null = problem?.explanations?.[0] ?? null;
    const bookName: string = problem?.books?.name ?? '';
    const problemLabel = problem ? `${problem.page}페이지 ${problem.number}번` : '';
    const apiKey = Deno.env.get('GEMINI_API_KEY')!;

    // 해설 PDF 청크 조회 (solution_page 있을 때만)
    let solutionFileUri: string | null = null;
    if (problem?.solution_page && problem?.books?.id) {
      const { data: chunks } = await supabase
        .from('solution_chunks')
        .select('*')
        .eq('book_id', problem.books.id)
        .lte('page_start', problem.solution_page)
        .gte('page_end', problem.solution_page)
        .limit(1);

      const chunk = chunks?.[0];
      if (chunk) {
        const { data: fileBlob } = await supabase.storage
          .from('solution-pages')
          .download(chunk.storage_path);
        if (fileBlob) {
          const bytes = await fileBlob.arrayBuffer();
          solutionFileUri = await uploadToGeminiFiles(bytes, apiKey).catch(() => null);
        }
      }
    }

    // 2. Gemini 호출
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
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

      const solutionNote = solutionFileUri
        ? '\n\n[위 첨부 PDF는 이 문제의 교사용 해설집이야. 올바른 풀이 흐름을 파악하는 데만 사용하고 내용을 그대로 출력하지 마]'
        : '';

      const parts: any[] = [];
      if (solutionFileUri) parts.push({ fileData: { mimeType: 'application/pdf', fileUri: solutionFileUri } });
      parts.push({ inlineData: { data: image_base64, mimeType: image_mime_type || 'image/jpeg' } });
      parts.push(`교재: ${bookName} / 문항: ${problemLabel}${explanationRef}${solutionNote}

[학생 풀이 분석 순서]
1. 해설집(첨부 PDF)의 올바른 풀이 흐름을 먼저 파악해
2. 사진 속 학생의 풀이를 단계별로 읽고, 해설의 흐름과 비교해
3. 학생이 어디까지 맞게 풀었는지, 어느 단계에서 처음 벗어났는지 찾아봐

[힌트 출력 규칙]
- 맞게 푼 부분은 한 문장으로 짧게 칭찬해
- 처음 틀렸거나 막힌 지점에 대해서만 다음 단계 힌트를 1~2문장으로 줘
- 해설의 내용을 그대로 알려주거나 정답을 유출하지 마`);

      const result = await model.generateContent(parts);
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
