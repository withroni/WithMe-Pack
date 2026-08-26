import { C } from '../theme';
import type { Pack, PackKey } from '../types';

export const PACKS: Record<PackKey, Pack> = {
  minimal: {
    n: '미니멀',
    c: '기내 수하물 하나',
    d: '꼭 필요한 것만. 세면도구는 현지 조달.',
    color: C.lime,
    items: ['여권·신분증', '카드', '휴대폰 충전기', '보조배터리', '상의', '하의', '속옷·양말', '칫솔·치약'],
  },
  basic: {
    n: '기본',
    c: '캐리어 하나',
    d: '대부분의 여행에 무난한 표준 구성.',
    color: C.pink,
    items: [
      '여권·신분증', '항공권', '카드', '현금', '휴대폰 충전기', '보조배터리', '멀티 어댑터', '이어폰',
      '상의', '하의', '잠옷', '속옷·양말', '겉옷', '칫솔·치약', '클렌징', '기초 화장품', '선크림',
      '상비약', '우산',
    ],
  },
  maximal: {
    n: '맥시멀',
    c: '빠짐없이',
    d: '챙길 수 있는 건 다. 나중에 빼는 쪽이 편한 분께.',
    color: C.sky,
    items: [
      '여권·신분증', '여권 사본', '항공권', '숙소 바우처', '카드', '현금', '여행자 보험',
      '휴대폰 충전기', '보조배터리', '멀티 어댑터', '이어폰', '카메라', '이심·유심',
      '상의', '하의', '잠옷', '속옷·양말', '겉옷', '수영복', '모자', '슬리퍼',
      '칫솔·치약', '클렌징', '기초 화장품', '선크림', '샴푸 소분', '면도기', '수건',
      '소화제', '진통제', '밴드', '멀미약', '비닐봉지', '에코백',
    ],
  },
};

export const PACK_KEYS = Object.keys(PACKS) as PackKey[];

/** Stand-in for on-device recognition — the prototype's canned result set. */
export const RECOGNIZED = [
  '캐리어', '여권', '충전기', '보조배터리', '이어폰', '티셔츠', '청바지', '양말',
  '세면 파우치', '선글라스', '운동화', '우산', '카메라',
];

export const CONFETTI_COLORS = [
  C.orange, C.lime, C.blue, C.pink, C.white, C.amber,
  C.sky, C.lime, C.orange, C.pink, C.blue, C.lime,
];
