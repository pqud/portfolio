import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { createHum } from './audio'
import { catalog, personas } from './content'
import { fallbackId, site } from './content/site'
import { atPaneEdge, enterScene, resolveRoute, stepScene, stripBase, wheelAction, withBase, type Pane } from './lib/logic'
import { Frame } from './components/Frame'
import { Hud } from './components/Hud'
import { Nav } from './components/Nav'
import { OrbMesh } from './components/Orb'
import { Pills } from './components/Pills'
import { AboutScene } from './components/scenes/AboutScene'
import { IntroScene } from './components/scenes/IntroScene'
import { MiscScene } from './components/scenes/MiscScene'
import { PortfolioScene } from './components/scenes/PortfolioScene'
import { ProjectScene } from './components/scenes/ProjectScene'

type PersonaId = keyof typeof personas

function readLocation() {
  const route = resolveRoute(stripBase(location.pathname, import.meta.env.BASE_URL), catalog, fallbackId)
  if ('redirect' in route) return { persona: fallbackId as PersonaId, projectId: null as string | null, scene: 0, redirect: true }
  return { persona: route.persona as PersonaId, projectId: route.projectId, scene: route.scene, redirect: false }
}

function paneBox(pane: HTMLElement | null): Pane | null {
  if (!pane) return null
  return { top: pane.scrollTop, height: pane.scrollHeight, client: pane.clientHeight }
}

export function App() {
  const boot = useRef(readLocation())
  const [personaId, setPersonaId] = useState(boot.current.persona)
  const [scene, setScene] = useState(boot.current.scene)
  const [projectId, setProjectId] = useState(boot.current.projectId)
  const [soundOn, setSoundOn] = useState(false)
  const [reduced, setReduced] = useState(false)
  const sceneRef = useRef(scene)
  const personaRef = useRef(personaId)
  const projectRef = useRef(projectId)
  const soundRef = useRef(false)
  const blocked = useRef(false)
  const touchY = useRef(0)
  const hum = useRef<ReturnType<typeof createHum> | null>(null)
  const startSceneRef = useRef(boot.current.scene)
  const [startScene, setStartScene] = useState(boot.current.scene)
  const isChangingRef = useRef(false)
  const [isChanging, setIsChanging] = useState(false)
  const reducedRef = useRef(false)
  const gestureRef = useRef(0)
  const callGesture = useRef(0)
  const startedGesture = useRef(0)
  const cancelledGesture = useRef(-1)
  const lastWheelAt = useRef(Number.NEGATIVE_INFINITY)


  sceneRef.current = scene
  personaRef.current = personaId
  projectRef.current = projectId
  reducedRef.current = reduced

  const persona = personas[personaId]
  const project = persona.projects.find((item) => item.id === projectId) ?? null

  function firstId() {
    return personas[personaRef.current].projects[0]?.id ?? null
  }

  function finishChange() {
    cancelledGesture.current = startedGesture.current
    isChangingRef.current = false
    setIsChanging(false)
  }

  function publish(dir: 'up' | 'down') {
    if (callGesture.current === cancelledGesture.current) return
    if (isChangingRef.current) return
    const from = startSceneRef.current
    const next = stepScene(from, dir)
    if (next === from) return
    isChangingRef.current = true
    startedGesture.current = callGesture.current

    setIsChanging(true)
    startSceneRef.current = next
    sceneRef.current = next
    setStartScene(next)
    setScene(next)
    if(enterScene(next, projectRef.current, firstId())) {
      const pid = enterScene(next, projectRef.current, firstId())
      projectRef.current = pid
      setProjectId(pid)
      const path = next === 4 && pid ? `/${personaRef.current}/${pid}` : `/${personaRef.current}`
      history.pushState({ scene: next, projectId: pid }, '', withBase(path, import.meta.env.BASE_URL))
    }
    isChangingRef.current = true
    console.log('[scene]', { from, to: next, via: dir })
    if (reducedRef.current) finishChange()
  }

  function goTo(next: number) {
    if (isChangingRef.current || next === startSceneRef.current) return
    const pid = enterScene(next, projectRef.current, firstId())
    isChangingRef.current = true
    setIsChanging(true)
    startSceneRef.current = next
    sceneRef.current = next
    projectRef.current = pid
    setStartScene(next)
    setScene(next)
    setProjectId(pid)
    const path = next === 4 && pid ? `/${personaRef.current}/${pid}` : `/${personaRef.current}`
    history.pushState({ scene: next, projectId: pid }, '', withBase(path, import.meta.env.BASE_URL))
    if (reducedRef.current) finishChange()
  }

  function openProject(id: string) {
    if (isChangingRef.current) return
    isChangingRef.current = true
    setIsChanging(true)
    startSceneRef.current = 4
    sceneRef.current = 4
    projectRef.current = id
    setStartScene(4)
    setScene(4)
    setProjectId(id)
    history.pushState({ scene: 4, projectId: id }, '', withBase(`/${personaRef.current}/${id}`, import.meta.env.BASE_URL))
    if (reducedRef.current) finishChange()
  }

  function onSceneEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return
    if (!event.currentTarget.classList.contains('on')) return
    finishChange()
  }

  function arm() {
    if (blocked.current || soundRef.current) return
    soundRef.current = true
    setSoundOn(true)
  }

  function toggleSound() {
    const next = !soundRef.current
    soundRef.current = next
    blocked.current = !next
    setSoundOn(next)
  }

  useEffect(() => {
    if (boot.current.redirect) history.replaceState({ scene: 0, projectId: null }, '', withBase('/', import.meta.env.BASE_URL))
    const onPop = () => {
      const route = resolveRoute(stripBase(location.pathname, import.meta.env.BASE_URL), catalog, fallbackId)
      if ('redirect' in route) {
               personaRef.current = fallbackId
        startSceneRef.current = 0
        sceneRef.current = 0
        projectRef.current = null
        setPersonaId(fallbackId)
        setStartScene(0)
        setScene(0)
        setProjectId(null)
        history.replaceState({ scene: 0, projectId: null }, '', withBase('/', import.meta.env.BASE_URL))
        return
      }
      const id = route.persona as PersonaId
      personaRef.current = id
      setPersonaId(id)
      const state = history.state as { scene?: number; projectId?: string | null } | null
      const next = route.projectId ? 4 : typeof state?.scene === 'number' ? state.scene : 0
      const pid = enterScene(next, route.projectId ?? state?.projectId ?? null, personas[id].projects[0]?.id ?? null)
      startSceneRef.current = next
      sceneRef.current = next
      projectRef.current = pid
      setStartScene(next)
      setScene(next)
      setProjectId(pid)
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      arm()
      const pane = document.querySelector<HTMLElement>('[data-pane]')
      const action = wheelAction(event.deltaY, paneBox(pane))
      if (action === 'pane') {
        if (pane) pane.scrollTop += event.deltaY
        return
      }
      const now = performance.now()
      if (now - lastWheelAt.current > 160) gestureRef.current += 1
      lastWheelAt.current = now
      callGesture.current = gestureRef.current
      publish(action)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'PageDown' && event.key !== 'PageUp') return
      event.preventDefault()
      arm()
      gestureRef.current += 1
      callGesture.current = gestureRef.current
      publish(event.key === 'ArrowDown' || event.key === 'PageDown' ? 'down' : 'up')
    }
    const onTouchStart = (event: TouchEvent) => {
      touchY.current = event.touches[0].clientY
      console.log('Start')
    }
    const onTouchMove = (event: TouchEvent) => {
      const pane = document.querySelector('[data-pane]')
      if (pane?.contains(event.target as Node)) return
      event.preventDefault()
    }
    const onTouchEnd = (event: TouchEvent) => {
      console.log('End')
      const dy = touchY.current - event.changedTouches[0].clientY
      if (Math.abs(dy) < 48) return
      const dir = dy > 0 ? 'down' : 'up'
      const pane = document.querySelector<HTMLElement>('[data-pane]')
      if (!atPaneEdge(dir, paneBox(pane))) return
      arm()
      gestureRef.current += 1
      callGesture.current = gestureRef.current
      publish(dir)
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(media.matches)
    apply()
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduced', reduced)
  }, [reduced])

  useEffect(() => {
    document.title = `${site.name} · ${persona.role}`
  }, [persona.role])

  useEffect(() => {
    if (!soundOn) {
      hum.current?.off()
      return
    }
    if (!hum.current) hum.current = createHum()
    hum.current.setScene(scene)
    void hum.current.on()
  }, [soundOn, scene])

  useEffect(() => () => hum.current?.close(), [])

  return (
    <>
      <Canvas
        className="canvas-wrap"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 5], fov: 35 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.2, 1.6, 3]} intensity={1.6} />
        <OrbMesh scene={scene} reduced={reduced} />
      </Canvas>
      <Nav name={site.name} items={site.nav} scene={scene} onGo={goTo} />
      <Pills projects={persona.projects} current={scene >= 3 ? projectId : null} visible={scene >= 3} onOpen={openProject} />
      <main data-changing={isChanging} data-start={startScene}>
        <Frame scene={scene} onEnd={onSceneEnd} index={0}>
          <IntroScene lead={persona.lead} role={persona.role} />
        </Frame>
        <Frame scene={scene} onEnd={onSceneEnd} index={1}>
          <PortfolioScene />
        </Frame>
        <Frame scene={scene} onEnd={onSceneEnd} index={2}>
          <AboutScene persona={persona} active={scene === 2} />
        </Frame>
        <Frame scene={scene} onEnd={onSceneEnd} index={3}>
          <span className="sr">작업</span>
        </Frame>
        <Frame scene={scene} onEnd={onSceneEnd} index={4}>
          <ProjectScene project={project} active={scene === 4} />
        </Frame>
        <Frame scene={scene} onEnd={onSceneEnd} index={5}>
          <MiscScene cards={site.misc} active={scene === 5} />
        </Frame>
      </main>
      <Hud scene={scene} soundOn={soundOn} onToggleSound={toggleSound} />
    </>
  )
}
