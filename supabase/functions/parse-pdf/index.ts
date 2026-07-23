// @ts-nocheck — Deno Edge Function
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { pdf_base64 } = await req.json();

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const prompt = `이 수학 교사용 해설집 PDF를 분석해서 각 문제의 정보를 추출해줘.

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

    const result = await model.generateContent([
      { inlineData: { data: pdf_base64, mimeType: 'application/pdf' } },
      prompt,
    ]);

    const text = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('JSON 파싱 실패');
    }

    return new Response(JSON.stringify(parsed), {
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
