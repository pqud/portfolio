import { ai } from './ai'
import { fe } from './fe'

export const personas = { fe, ai }

export const catalog = [fe, ai].map((persona) => ({
  id: persona.id,
  projects: persona.projects.map((project) => project.id),
}))
