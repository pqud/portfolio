import { useEffect, useRef, useState } from 'react'
import type { Project } from '../../content/types'
import { InfoCard } from '../InfoCard'

export function ProjectScene({ project, active }: { project: Project | null; active: boolean }) {
  const [shown, setShown] = useState(project)
  const [on, setOn] = useState(true)
  const shownId = useRef(project?.id ?? null)
  const pane = active ? { 'data-pane': '' } : {}

  useEffect(() => {
    const nextId = project?.id ?? null
    if (nextId === shownId.current) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      shownId.current = nextId
      setShown(project)
      setOn(true)
      return
    }
    setOn(false)
    const timer = window.setTimeout(() => {
      shownId.current = nextId
      setShown(project)
    }, 280)
    return () => window.clearTimeout(timer)
  }, [project])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(frame)
  }, [shown])

  if (!shown) {
    return (
      <div className="pane" {...pane}>
        <p>프로젝트가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="pane" {...pane}>
      <div className={on ? 'swap on' : 'swap'}>
        <p className="kicker">{shown.summary}</p>
        <h2 className="project-name">{shown.name}</h2>
        <div className="cards">
          <InfoCard title="기간" body={shown.period} />
          <InfoCard title="인원" body={shown.team} />
          <InfoCard title="역할" body={shown.role} />
          <InfoCard title="기술" body={shown.stack} />
          {shown.cards.map((card) => (
            <InfoCard key={card.title} {...card} />
          ))}
        </div>
        {shown.links.length > 0 && (
          <p className="links">
            {shown.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  )
}
