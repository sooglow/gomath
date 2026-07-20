-- 일품 수학 중3-1 12쪽 8번 (고난도문제) 추가
insert into problems (book_id, page, number, topic)
select id, '12', '8', '고난도 - 함수와 제곱근'
from books
where name = '일품 수학 중3-1'
on conflict (book_id, page, number) do nothing;

-- 해설 추가
insert into explanations (problem_id, full_explanation, key_concepts, hint_steps)
select
  p.id,
  'f(x)는 √x 이하의 자연수의 개수이므로 f(x) = floor(√x)이다.

  구간별로 f(x) 값을 구한다:
  - x=9~15일 때: √x의 정수 부분이 3 → f(x)=3, 총 7개 항 → 7×3=21
  - x=16~24일 때: √x의 정수 부분이 4 → f(x)=4, 총 9개 항 → 9×4=36
  - x=25~30일 때: √x의 정수 부분이 5 → f(x)=5, 총 6개 항 → 6×5=30

  f(9)+f(10)+...+f(30) = 21+36+30 = 87

  정답: ④ 87',
  array['제곱근의 정수 부분', 'floor 함수', '구간별 분류', '합산'],
  array[
    'f(x)가 뭘 의미하는지 먼저 정확히 파악해봐. √x 이하의 자연수 개수는 √x의 소수점을 버린 정수값(floor)이랑 같아',
    'x값이 바뀔 때 f(x)가 언제 바뀌는지 생각해봐. 완전제곱수(9, 16, 25)를 기준으로 구간을 나눠봐',
    '9부터 15까지 f(x)는 전부 같아. 그 공통값이 뭔지 구해봐',
    '구간을 9~15, 16~24, 25~30 세 부분으로 나눠서 각각의 합을 더해봐'
  ]
from problems p
join books b on p.book_id = b.id
where b.name = '일품 수학 중3-1'
  and p.page = '12'
  and p.number = '8'
on conflict (problem_id) do update
  set full_explanation = excluded.full_explanation,
      key_concepts     = excluded.key_concepts,
      hint_steps       = excluded.hint_steps,
      updated_at       = now();
