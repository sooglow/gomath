-- 일품 수학 중3-1 교재가 없으면 추가
insert into books (name)
values ('일품 수학 중3-1')
on conflict (name) do nothing;

-- 8쪽 12번 문항 추가
insert into problems (book_id, page, number, topic)
select id, '8', '12', '순환소수'
from books
where name = '일품 수학 중3-1'
on conflict (book_id, page, number) do nothing;

-- 해설 추가
insert into explanations (problem_id, full_explanation, key_concepts, hint_steps)
select
  p.id,
  '0.14반복 + x = 1.51반복 - 28/45 에서 순환소수를 분수로 변환한다.
  0.14반복(4만 반복)은 (14-1)/90 = 13/90 이다.
  1.51반복(1만 반복)은 (151-15)/90 = 136/90 이다.
  28/45 = 56/90 으로 통분한다.
  13/90 + x = 136/90 - 56/90 = 80/90
  x = 80/90 - 13/90 = 67/90
  67/90 = 0.7444... = 0.74반복
  정답: 0.74반복',
  array['순환소수', '분수 변환', '통분'],
  array[
    '순환소수를 분수로 바꾸는 공식을 떠올려봐. 소수점 아래 순환하지 않는 자리수와 순환하는 자리수를 세어봐',
    '0.14반복에서 순환하는 숫자는 4 하나야. 공식 (전체수 - 순환 안 하는 부분) / 90 을 써봐',
    '1.51반복도 같은 방법으로 분수로 바꿔봐. 분모가 90이 되니까 28/45를 통분해줘야 해',
    '13/90 + x = 136/90 - 56/90 이 됐어. 이제 x를 구해봐'
  ]
from problems p
join books b on p.book_id = b.id
where b.name = '일품 수학 중3-1'
  and p.page = '8'
  and p.number = '12'
on conflict (problem_id) do update
  set full_explanation = excluded.full_explanation,
      key_concepts     = excluded.key_concepts,
      hint_steps       = excluded.hint_steps,
      updated_at       = now();
