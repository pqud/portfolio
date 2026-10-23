import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  GLSL1, HalfFloatType, LinearFilter, MeshBasicMaterial, Mesh,
  OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  Vector2, WebGLRenderTarget, type Group,
} from 'three'
import { dewFragment, dewVertex } from './dewShader'
import { simFragment, simVertex } from './waveSimShader'

const SIM_SIZE = 256
const DROP_INTERVAL = 3.2  // seconds between drops

// Equirectangular UV positions for water drops (spread around the sphere)
const DROP_POSITIONS: [number, number][] = [
  [0.60, 0.72],
  [0.12, 0.50],
  [0.75, 0.28],
  [0.35, 0.65],
  [0.88, 0.55],
]

function poseFor(scene: number) {
  if (scene <= 0) return { x: 0, s: 0.72 }
  if (scene === 1) return { x: 0, s: 2.7 }
  return { x: -3.2, s: 2.35 }
}

function ease(u: number) {
  return u < 0.5 ? 2 * u * u : 1 - ((-2 * u + 2) ** 2) / 2
}

export function OrbMesh({ scene, reduced }: { scene: number; reduced: boolean }) {
  const group  = useRef<Group>(null)
  const rings  = useRef<Group>(null)
  const born   = useRef(performance.now())
  const skipArt = useRef(scene >= 2)
  const start  = poseFor(scene)
  const pose   = useRef({ x: start.x, s: start.s, fromX: start.x, fromS: start.s, toX: start.x, toS: start.s, t0: 0 })

  // Ping-pong render targets
  const rtA     = useRef<WebGLRenderTarget | null>(null)
  const rtB     = useRef<WebGLRenderTarget | null>(null)
  const readIsA = useRef(true)   // true → read A, write B

  // Offscreen simulation scene
  const simScene = useRef(new Scene())
  const simCam   = useRef(new OrthographicCamera(-1, 1, 1, -1, 0, 1))
  const simMat   = useRef<ShaderMaterial | null>(null)

  // Drop scheduling
  const dropIdx    = useRef(0)
  const lastDropAt = useRef(-DROP_INTERVAL)  // trigger first drop immediately

  const mat = useMemo(
    () =>
      new ShaderMaterial({
        glslVersion: GLSL1,
        transparent: true,
        toneMapped: false,
        vertexShader: dewVertex,
        fragmentShader: dewFragment,
        uniforms: {
          u_simTex:    { value: null },
          u_intensity: { value: 0 },
          u_time:      { value: 0 },
        },
      }),
    [],
  )

  const backMat = useMemo(() => new MeshBasicMaterial({ color: '#ffffff' }), [])
  const ringMat = useMemo(() => new MeshBasicMaterial({ color: '#efe8ff', transparent: true, opacity: 0 }), [])

  // Create render targets and sim scene
  useEffect(() => {
    const makeRT = () =>
      new WebGLRenderTarget(SIM_SIZE, SIM_SIZE, {
        type: HalfFloatType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false,
      })
    rtA.current = makeRT()
    rtB.current = makeRT()

    const sm = new ShaderMaterial({
      glslVersion: GLSL1,
      vertexShader: simVertex,
      fragmentShader: simFragment,
      uniforms: {
        u_prev:    { value: null },
        u_hasDrop: { value: 0 },
        u_dropUV:  { value: new Vector2(0.5, 0.5) },
        u_dropStr: { value: 0.8 },
      },
    })
    const quad = new Mesh(new PlaneGeometry(2, 2), sm)
    simScene.current.add(quad)
    simMat.current = sm

    return () => {
      rtA.current?.dispose()
      rtB.current?.dispose()
      sm.dispose()
      quad.geometry.dispose()
      simScene.current.clear()
    }
  }, [])

  useEffect(() => () => {
    mat.dispose()
    backMat.dispose()
    ringMat.dispose()
  }, [mat, backMat, ringMat])

  useEffect(() => {
    const current = pose.current
    const next = poseFor(scene)
    current.fromX = current.x
    current.fromS = current.s
    current.toX = next.x
    current.toS = next.s
    current.t0 = performance.now()
  }, [scene, reduced])

  useFrame((state) => {
    const gl = state.gl
    const sm = simMat.current
    const a  = rtA.current
    const b  = rtB.current

    // --- Simulation step ---
    if (sm && a && b && !reduced) {
      const read  = readIsA.current ? a : b
      const write = readIsA.current ? b : a

      const elapsed = state.clock.elapsedTime
      const hasDrop = elapsed - lastDropAt.current >= DROP_INTERVAL

      sm.uniforms.u_prev.value    = read.texture
      sm.uniforms.u_hasDrop.value = hasDrop ? 1 : 0

      if (hasDrop) {
        const idx = dropIdx.current % DROP_POSITIONS.length
        sm.uniforms.u_dropUV.value.set(DROP_POSITIONS[idx][0], DROP_POSITIONS[idx][1])
        sm.uniforms.u_dropStr.value = 0.28 + Math.random() * 0.18
        dropIdx.current += 1
        lastDropAt.current = elapsed
      }

      gl.setRenderTarget(write)
      gl.render(simScene.current, simCam.current)
      gl.setRenderTarget(null)

      readIsA.current = !readIsA.current
      mat.uniforms.u_simTex.value = (readIsA.current ? a : b).texture
    }

    // --- Pose animation ---
    const current = pose.current
    const u = reduced ? 1 : Math.min(1, (performance.now() - current.t0) / 800)
    const e = reduced ? 1 : ease(u)
    current.x = current.fromX + (current.toX - current.fromX) * e
    current.s = current.fromS + (current.toS - current.fromS) * e

    const intro  = skipArt.current || reduced ? 1 : Math.min(1, (performance.now() - born.current) / 1500)
    const appear = 1 - (1 - intro) ** 3

    mat.uniforms.u_intensity.value = reduced ? 0 : 1.15
    if (!reduced) mat.uniforms.u_time.value += 0.016
    ringMat.opacity = skipArt.current ? 0 : 1 - intro

    if (group.current) {
      group.current.position.x = current.x
      group.current.scale.setScalar(current.s * (skipArt.current ? 1 : 0.15 + 0.85 * appear))
    }
    if (rings.current && ringMat.opacity > 0 && !reduced) rings.current.rotation.z += 0.004
  })

  return (
    <group ref={group}>
      <mesh material={backMat} position={[0, 0, -0.01]}>
        <sphereGeometry args={[0.30, 64, 64]} />
      </mesh>
      <mesh material={mat}>
        <sphereGeometry args={[0.72, 96, 96]} />
      </mesh>
      <group ref={rings}>
        {[0.86, 1.0, 1.16].map((radius) => (
          <mesh key={radius} material={ringMat}>
            <torusGeometry args={[radius, 0.006, 8, 96]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
