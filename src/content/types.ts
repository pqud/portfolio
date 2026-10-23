export type Card = { title: string; body: string; media?: string }

export type Project = {
  id: string
  name: string
  summary: string
  period: string
  team: string
  role: string
  stack: string
  links: { label: string; href: string }[]
  cards: Card[]
}

export type Persona = {
  id: string
  role: string
  lead: string
  about: string
  education: { period: string; title: string; body: string }
  award: { period: string; title: string; body: string }
  career: { period: string; title: string; body: string }
  projects: Project[]
}
