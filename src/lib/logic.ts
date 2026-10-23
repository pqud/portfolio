export type Pane = { top: number; height: number; client: number }

export type RouteHit = { persona: string; projectId: string | null; scene: number }
export type Route = RouteHit | { redirect: '/' }

export function resolveRoute(
  pathname: string,
  known: { id: string; projects: string[] }[],
  fallbackId: string,
): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return { persona: fallbackId, projectId: null, scene: 0 }
  const persona = known.find((item) => item.id === parts[0])
  if (!persona || parts.length > 2) return { redirect: '/' }
  if (parts.length === 1) return { persona: persona.id, projectId: null, scene: 0 }
  if (!persona.projects.includes(parts[1])) return { redirect: '/' }
  return { persona: persona.id, projectId: parts[1], scene: 4 }
}

export function stepScene(scene: number, dir: 'up' | 'down', last = 5) {
  if (dir === 'down') return Math.min(last, scene + 1)
  return Math.max(0, scene - 1)
}

export function enterScene(next: number, projectId: string | null, firstId: string | null) {
  if (next === 4) return projectId ?? firstId
  return projectId
}

export function wheelAction(deltaY: number, pane: Pane | null): 'up' | 'down' | 'pane' {
  if (pane && pane.height > pane.client + 1) {
    const max = pane.height - pane.client
    if (deltaY > 0 && pane.top < max - 1) return 'pane'
    if (deltaY < 0 && pane.top > 1) return 'pane'
  }
  return deltaY >= 0 ? 'down' : 'up'
}

const GESTURE_GAP = 160

export type WheelGate = { lastAt: number; snapped: boolean }

export function freshWheelGate(): WheelGate {
  return { lastAt: Number.NEGATIVE_INFINITY, snapped: false }
}

export function takeWheel(gate: WheelGate, now: number) {
  const sameGesture = now - gate.lastAt <= GESTURE_GAP
  gate.lastAt = now
  if (sameGesture && gate.snapped) return { snap: false }
  gate.snapped = true
  return { snap: true }
}

export function atPaneEdge(dir: 'up' | 'down', pane: Pane | null) {
  if (!pane) return true
  const max = pane.height - pane.client
  if (max <= 1) return true
  if (dir === 'down') return pane.top >= max - 2
  return pane.top <= 2
}
