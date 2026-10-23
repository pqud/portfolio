import type { Card } from './types'

export const fallbackId = 'fe'

export const sceneLabels = ['처음', 'Portfolio', '소개', '작업', '프로젝트', '기타']

export const site = {
  name: '김서우',
  nav: [
    { label: '처음', scene: 0 },
    { label: '소개', scene: 2 },
    { label: '작업', scene: 3 },
  ],
  misc: [
    { title: '자격증', body: '정보처리기사\n웹 디자인 기능사' },
    { title: '학교', body: '가상대학교 컴퓨터공학과\n2020.03 — 2024.02' },
    { title: '취미', body: '필름 사진, 짧은 글, 밤 산책.' },
    { title: '개인 프로젝트', body: '기록 도구와 작은 실험을 개인 저장소에 모아 둔다.' },
  ] satisfies Card[],
}
