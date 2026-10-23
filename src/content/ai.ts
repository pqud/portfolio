import type { Persona } from './types'

export const ai: Persona = {
  id: 'ai',
  role: 'AI 개발자',
  lead: '모델의 결과를 사람이 다룰 수 있는 흐름으로.',
  about: '실험 결과를 화면과 평가로 연결해, 다시 쓸 수 있는 도구로 만듭니다.',
  education: {
    period: '2020.03 — 2024.02',
    title: '가상대학교 컴퓨터공학과',
    body: '기계학습과 데이터 처리 기초를 공부했습니다.',
  },
  award: {
    period: '2024.06',
    title: '교내 AI 경진대회 장려',
    body: '분류 파이프라인의 전처리와 평가를 맡았습니다.',
  },
  career: {
    period: '2025.01 — 2025.08',
    title: '랩 B · 리서치 엔지니어',
    body: '추론 API와 평가 스크립트를 붙여 반복 실험을 줄였습니다.',
  },
  projects: [
    {
      id: 'label-bench',
      name: 'Label bench',
      summary: '분류 결과를 사람이 검토하고 다시 학습 세트로 보내는 벤치.',
      period: '2025.04 — 2025.07',
      team: '2명 / 모델링',
      role: '평가 루프, 오류 표본 정리',
      stack: 'Python · FastAPI',
      links: [],
      cards: [
        { title: '문제', body: '오분류가 로그에만 남고 다음 학습으로 돌아오지 않았습니다.' },
        { title: '결과', body: '틀린 표본을 태그와 함께 다시 세트로 내보냅니다.' },
      ],
    },
  ],
}
