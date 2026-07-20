import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Explanation } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

const BASE_INSTRUCTION = `너는 친절한 수학 선생님이야.
학생이 문제나 풀이 사진을 보내면, 속으로 단계별 풀이 과정을 끝까지 생각해라. (절대 출력하지 말 것)
[최종 지시] 정답과 전체 풀이는 절대 유출하지 말고, 학생이 스스로 다음 단계를 생각할 수 있는 결정적인 힌트 1~2문장만 출력해라.
반드시 한국어로, 친근하고 따뜻한 반말 말투로 답해라.`;

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type HintContext = {
  book: string;
  problem: string;
  explanation: Explanation | null;
};

export async function getHintFromImage(file: File, context: HintContext): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildInstruction(context.explanation),
  });
  const base64 = await fileToBase64(file);
  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: file.type } },
    `교재: ${context.book} / 문항: ${context.problem}\n학생이 풀이 사진을 보냈어. 힌트를 줘.`,
  ]);
  return result.response.text();
}

export async function getHintFromText(userMessage: string, context: HintContext): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildInstruction(context.explanation),
  });
  const result = await model.generateContent(
    `교재: ${context.book} / 문항: ${context.problem}\n학생 질문: "${userMessage}"`
  );
  return result.response.text();
}
