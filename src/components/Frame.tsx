import type { ReactNode } from 'react'

export function Frame({
  scene,
  index,
  onEnd,
  children,
}: {
  scene: number
  index: number
  onEnd: (event: React.TransitionEvent<HTMLDivElement>) => void
  children: ReactNode
}) {
  const cls = index === scene ? 'shot on' : index > scene ? 'shot next' : 'shot prev'
  return <div className={cls} onTransitionEnd={onEnd}>{children}</div>
}
