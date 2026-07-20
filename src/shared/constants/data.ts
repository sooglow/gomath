import type { NoteType } from '../types';

export const MOCK_NOTES: NoteType[] = [
  { id: '1', book: '개념원리 중3-1', page: '32p', problem: '5번', date: '오늘', tag: '이차방정식', solved: false, hint: '판별식 b²-4ac를 먼저 구해봐' },
  { id: '2', book: '쎈 수학 중3-1', page: '45p', problem: '12번', date: '어제', tag: '인수분해', solved: true, hint: '공통인수를 먼저 묶어봐' },
  { id: '3', book: '개념원리 중3-1', page: '18p', problem: '3번', date: '2일 전', tag: '제곱근', solved: true, hint: '√(a²) = |a| 임을 기억해' },
  { id: '4', book: '일품 수학 중3-1', page: '62p', problem: '7번', date: '3일 전', tag: '이차함수', solved: false, hint: '꼭짓점 좌표부터 구해봐' },
  { id: '5', book: '쎈 수학 중3-1', page: '29p', problem: '9번', date: '4일 전', tag: '다항식', solved: true, hint: '분배법칙으로 전개해봐' },
];

export const BOOKS = ['개념원리 중3-1', '쎈 수학 중3-1', '일품 수학 중3-1', '최상위 수학 중3'];

export const PROBLEMS: Record<string, string[]> = {
  '개념원리 중3-1': ['32페이지 5번', '33페이지 12번', '45페이지 2번', '52페이지 7번'],
  '쎈 수학 중3-1': ['15페이지 3번', '29페이지 9번', '45페이지 12번', '61페이지 4번'],
  '일품 수학 중3-1': ['22페이지 1번', '38페이지 6번', '62페이지 7번', '74페이지 11번'],
  '최상위 수학 중3': ['10페이지 2번', '25페이지 8번', '41페이지 5번'],
};

export const TAG_COLORS: Record<string, string> = {
  '이차방정식': 'bg-violet-100 text-violet-700',
  '인수분해': 'bg-blue-100 text-blue-700',
  '제곱근': 'bg-green-100 text-green-700',
  '이차함수': 'bg-orange-100 text-orange-700',
  '다항식': 'bg-pink-100 text-pink-700',
};

export const MOCK_HINTS = [
  '이차방정식을 풀 때는 판별식 b²-4ac를 먼저 구해봐. 지금 a, b, c 값이 각각 얼마야?',
  '3번째 줄까지 전개를 잘 했어! 그런데 2x의 부호를 확인해봐. 마이너스가 맞을까?',
  '인수분해할 때 공통인수를 먼저 묶는 게 핵심이야. 두 항에서 공통으로 나눌 수 있는 수가 보이니?',
  '근의 공식 x = (-b ± √(b²-4ac)) / 2a 에서 a, b, c를 먼저 정확히 파악해봐!',
  '양변을 같은 수로 나눌 때 부호가 바뀌는 경우를 생각해봤어? 그 부분을 다시 확인해봐.',
];
