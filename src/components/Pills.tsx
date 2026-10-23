import type { Project } from '../content/types'

function arcStyle(index: number, count: number) {
  const t = count === 1 ? 0.5 : index / (count - 1)
  const angle = -0.48 + t * 0.96
  const radius = 31
  return {
    left: `${-8 + Math.cos(angle) * radius}vw`,
    top: `calc(50vh + ${Math.sin(angle) * radius}vw)`,
  }
}

export function Pills({
  projects,
  current,
  visible,
  onOpen,
}: {
  projects: Project[]
  current: string | null
  visible: boolean
  onOpen: (id: string) => void
}) {
  return (
    <div className={visible ? 'pills on' : 'pills'} aria-hidden={!visible}>
      {projects.map((project, index) => (
        <button
          key={project.id}
          className={project.id === current ? 'pill current' : 'pill'}
          style={arcStyle(index, projects.length)}
          tabIndex={visible ? 0 : -1}
          onClick={() => onOpen(project.id)}
        >
          {project.name}
        </button>
      ))}
    </div>
  )
}
