import type { Persona } from './types'

export const fe: Persona = {
  id: 'fe',
  role: '프론트엔드 개발자',
  lead: '작은 차이로, 더 나은 사용.',
  about: '보이기 않는 복잡함을 정리해, 자연스럽게 쓰이는 화면을 만듭니다.',
  education: {
    period: '2020.03 — 2024.02',
    title: '가상대학교 컴퓨터공학과',
    body: '웹 기술과 사용자 경험을 함께 공부했습니다.',
  },
  award: {
    period: '2023.11',
    title: '교내 웹 프로젝트 우수상',
    body: '팀 프로젝트의 프론트엔드 구현을 맡았습니다.',
  },
  career: {
    period: '2024.03 — 2025.12',
    title: '스튜디오 A · 프론트엔드',
    body: '서비스 UI와 공통 컴포넌트를 설계하고 구현했습니다.',
  },
  projects: [
    {
      id: 'harudew',
      name: 'HARUDEW',
      summary: '하루의 조각을 모아 흐름을 발견하는 일상 기록.',
      period: '2025.03 — 2025.05',
      team: '3명 / 프론트엔드',
      role: '화면 설계, UI 구현, API 연동',
      stack: 'React · TypeScript',
      links: [{ label: '깃허브', href: 'https://github.com' }],
      cards: [
        { title: '요청', body: '화면 전환 시 반복되던 데이터 요청을 줄였습니다.' },
        { title: '결과', body: '기록에서 탐색까지 이어지는 흐름을 한 화면에 모았습니다.' },
      ],
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      summary: '기획부터 배포까지, 열 주를 개인 학습으로 쌓은 프로젝트.',
      period: '2024.11 — 2025.01',
      team: '1명 / 프론트엔드',
      role: '설계와 구현',
      stack: 'React · TypeScript',
      links: [],
      cards: [
        { title: '범위', body: '지표 카드와 필터를 한 그리드 안에서 전환합니다.' },
        { title: '배운 점', body: '빈 상태와 로딩을 데이터와 같은 계층에 두었습니다.' },
      ],
    },
  ],
}
