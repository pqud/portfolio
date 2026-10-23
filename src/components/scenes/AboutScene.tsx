import type { Persona } from '../../content/types'
import { InfoCard } from '../InfoCard'

export function AboutScene({ persona, active }: { persona: Persona; active: boolean }) {
  const pane = active ? { 'data-pane': '' } : {}
  return (
    <>
      <h2 className="display left">소개</h2>
      <div className="pane about-grid" {...pane}>
        <InfoCard title={persona.role} body={persona.about} />
        <InfoCard
          title="학력"
          body={`${persona.education.period}\n${persona.education.title}\n${persona.education.body}`}
        />
        <InfoCard
          title="경력"
          body={`${persona.career.period}\n${persona.career.title}\n${persona.career.body}`}
        />
        <InfoCard title="수상" body={`${persona.award.period}\n${persona.award.title}\n${persona.award.body}`} />
      </div>
    </>
  )
}
