import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Explanation } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

const BASE_INSTRUCTION = `너는 친절한 수학 선생님이야.
학생이 문제나 풀이 사진을 보내면, 속으로 단계별 풀이 과정을 끝까지 생각해라. (절대 출력하지 말 것)
[최종 지시] 정답과 전체 풀이는 절대 유출하지 말고, 학생이 스스로 다음 단계를 생각할 수 있는 결정적인 힌트 1~2문장만 출력해라.
반드시 한국어로, 친근하고 따뜻한 반말 말투로 답해라.
[형식 지시] 수식은 LaTeX($, $$) 없이 일반 텍스트로 써라. 예: x=1, 4x+y=-7, x²+y² 처럼 표현해라.`;

function buildInstruction(explanation: Explanation | null): string {
  if (!explanation) return BASE_INSTRUCTION;

  const concepts = explanation.key_concepts?.join(', ') ?? '';
  const steps = explanation.hint_steps?.map((s, i) => `${i + 1}. ${s}`).join('\n') ?? '';

  return `${BASE_INSTRUCTION}

[교사가 사전에 입력한 해설 — 참고 전용, 절대 그대로 출력하지 말 것]
${explanation.full_explanation}
${concepts ? `\n핵심 개념: ${concepts}` : ''}
${steps ? `\n단계별 힌트 가이드:\n${steps}` : ''}`;
}


// 이미지를 최대 1024px, JPEG 70%로 압축해서 TPM 절약
function compressImage(file: File, maxPx = 1024, quality = 0.7): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else { width = Math.round(width * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

type HintContext = {
  book: string;
  problem: string;
  explanation: Explanation | null;
};

export async function getHintFromImage(file: File, context: HintContext): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    systemInstruction: buildInstruction(context.explanation),
  });
  const { base64, mimeType } = await compressImage(file);

  const explanationRef = context.explanation
    ? `\n\n[교사 해설 요약 — 올바른 풀이 흐름]\n${context.explanation.full_explanation}${
        context.explanation.hint_steps?.length
          ? '\n\n올바른 단계 순서:\n' + context.explanation.hint_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : ''
      }`
    : '';

  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType } },
    `교재: ${context.book} / 문항: ${context.problem}
${explanationRef}

[학생 풀이 분석 순서]
1. 위 교사 해설의 올바른 풀이 흐름을 머릿속에 먼저 파악해
2. 사진 속 학생의 풀이를 단계별로 읽고, 교사 해설의 흐름과 비교해
3. 학생이 어디까지 맞게 풀었는지, 어느 단계에서 처음 벗어났는지 찾아봐

[힌트 출력 규칙]
- 맞게 푼 부분은 한 문장으로 짧게 칭찬해
- 처음 틀렸거나 막힌 지점에 대해서만 다음 단계 힌트를 1~2문장으로 줘
- 교사 해설의 내용을 그대로 알려주거나 정답을 유출하지 마`,
  ]);
  return result.response.text();
}

export async function getHintFromText(userMessage: string, context: HintContext): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    systemInstruction: buildInstruction(context.explanation),
  });
  const result = await model.generateContent(
    `교재: ${context.book} / 문항: ${context.problem}\n학생 질문: "${userMessage}"`
  );
  return result.response.text();
}
