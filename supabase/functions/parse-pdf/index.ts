// @ts-nocheck — Deno Edge Function
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function uploadToGeminiFiles(pdfBytes: ArrayBuffer, apiKey: string): Promise<string> {
  const boundary = 'boundary' + Date.now();
  const metaPart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `{"file":{"display_name":"document.pdf"}}\r\n` +
    `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`
  );
  const endPart = new TextEncoder().encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metaPart.byteLength + pdfBytes.byteLength + endPart.byteLength);
  body.set(metaPart, 0);
  body.set(new Uint8Array(pdfBytes), metaPart.byteLength);
  body.set(endPart, metaPart.byteLength + pdfBytes.byteLength);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  if (!res.ok) throw new Error(`Gemini Files upload (${res.status}): ${await res.text()}`);
  const { file } = await res.json();
  return file.uri;
}

const PROMPT = `이 수학 교사용 해설집 PDF를 분석해서 각 문제의 정보를 추출해줘.

반드시 아래 JSON 형식으로만 반환해:
{
  "problems": [
    {
      "page": "8",
      "number": "1",
      "topic": "이차방정식",
      "full_explanation": "전체 풀이 과정을 상세하게",
      "key_concepts": ["이차방정식", "인수분해"],
      "hint_steps": ["먼저 이항하여 정리해봐", "인수분해가 가능한지 확인해봐", "각 인수를 0으로 놓고 풀어봐"]
    }
  ]
}

추출 규칙:
- page: 교재(문제집) 원본 페이지 번호 (해설집 페이지가 아닌 문제집 기준)
- number: 문제 번호 (숫자만, 예: "1", "12")
- topic: 이 문제의 수학 주제 (예: "이차방정식", "연립방정식")
- full_explanation: 상세한 풀이 과정 (LaTeX 없이 일반 텍스트, x^2 형태로 표기)
- key_concepts: 핵심 개념 2~4개 배열
- hint_steps: 학생에게 줄 단계별 힌트 3~4개 (정답 직접 언급 금지, 다음 단계를 생각하게 하는 힌트)`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const apiKey = Deno.env.get('GEMINI_API_KEY')!;

  try {
    const { storage_path } = await req.json();
    if (!storage_path) throw new Error('storage_path 누락');

    // Supabase Storage에서 PDF 다운로드
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: fileBlob, error: dlError } = await supabaseAdmin.storage
      .from('pdf-uploads')
      .download(storage_path);
    if (dlError) throw new Error(`Storage 다운로드 실패: ${dlError.message}`);

    const pdfBytes = await fileBlob.arrayBuffer();
    const sizeMB = (pdfBytes.byteLength / 1024 / 1024).toFixed(1);
    console.log(`PDF 다운로드 완료: ${sizeMB}MB`);

    // Gemini Files API에 업로드
    const fileUri = await uploadToGeminiFiles(pdfBytes, apiKey);
    console.log(`Gemini Files 업로드 완료: ${fileUri}`);

    // Gemini로 분석
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { fileData: { mimeType: 'application/pdf', fileUri } },
            { text: PROMPT },
          ]}],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      }
    );
    if (!geminiRes.ok) throw new Error(`Gemini 분석 실패 (${geminiRes.status}): ${await geminiRes.text()}`);

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error(`JSON 파싱 실패. 응답: ${text.slice(0, 200)}`);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('parse-pdf error:', error);
    // 항상 200으로 반환해서 프론트에서 에러 메시지를 볼 수 있게
    return new Response(JSON.stringify({ error: (error as Error).message, problems: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
