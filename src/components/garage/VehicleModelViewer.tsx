import { Center } from '@react-three/drei/core/Center'
import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Environment } from '@react-three/drei/core/Environment'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { Loader2, Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import {
  BackSide,
  CanvasTexture,
  Color,
  RepeatWrapping,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { VehicleModelSpec } from '@/data/vehicleModels'
import mustangUrl from '@/assets/models/1965-ford-mustang-coupe.glb?url'

export type VehicleModelPose = {
  hoodOpen?: boolean
  trunkOpen?: boolean
  doorLOpen?: boolean
  doorROpen?: boolean
}

export type StudioTheme = 'dark' | 'light'

type VehicleModelViewerProps = {
  spec: VehicleModelSpec | null
  color?: string | null
  autoRotate?: boolean
  pose?: VehicleModelPose
  className?: string
  showControls?: boolean
  onCaptureReady?: (capture: (() => string) | null) => void
}

const MIN_DISTANCE = 3.4
const MAX_DISTANCE = 10
const ZOOM_STEP = 1.22
const THEME_KEY = 'garage-studio-theme'

const THEMES = {
  dark: {
    background: '#121214',
    cove: '#161618',
    floor: '#1a1a1d',
    platform: '#26262b',
    ring: '#6a6a72',
    fogNear: 9,
    fogFar: 22,
    sky: '#c5ccd6',
    ground: '#161618',
    hemi: 0.42,
    ambient: 0.22,
    key: 1.35,
    rim: 0.42,
    rimColor: '#8ea0b8',
    spot: 28,
    spotColor: '#f3f1ea',
    barA: '#ecece8',
    barB: '#d8dde4',
    gridCenter: '#2e2e33',
    gridMid: '#1c1c20',
    gridEdge: '#101012',
    gridLine: 'rgba(255,255,255,0.04)',
    shadow: 0.48,
    reflectBase: '#2a2c31',
    reflectFloor: '#101012',
  },
  light: {
    background: '#d9dce2',
    cove: '#e7e9ee',
    floor: '#d4d7de',
    platform: '#f4f5f7',
    ring: '#9aa0aa',
    fogNear: 11,
    fogFar: 24,
    sky: '#ffffff',
    ground: '#c5c8d0',
    hemi: 0.72,
    ambient: 0.55,
    key: 1.55,
    rim: 0.32,
    rimColor: '#8a96a8',
    spot: 18,
    spotColor: '#fff7ea',
    barA: '#ffffff',
    barB: '#f0f2f6',
    gridCenter: '#f7f8fa',
    gridMid: '#dfe2e8',
    gridEdge: '#c5c9d2',
    gridLine: 'rgba(20,22,28,0.07)',
    shadow: 0.26,
    reflectBase: '#8d929b',
    reflectFloor: '#b9bdc5',
  },
} as const

type ThemeTokens = (typeof THEMES)[StudioTheme]

let storedTheme: StudioTheme = 'dark'
const themeListeners = new Set<(theme: StudioTheme) => void>()

function readStoredTheme(): StudioTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
}

function useStudioTheme(): [StudioTheme, (theme: StudioTheme) => void] {
  const [theme, setTheme] = useState<StudioTheme>(storedTheme)

  useEffect(() => {
    storedTheme = readStoredTheme()
    setTheme(storedTheme)
    const onChange = (next: StudioTheme) => setTheme(next)
    themeListeners.add(onChange)
    return () => {
      themeListeners.delete(onChange)
    }
  }, [])

  function update(next: StudioTheme) {
    storedTheme = next
    window.localStorage.setItem(THEME_KEY, next)
    themeListeners.forEach((listener) => listener(next))
  }

  return [theme, update]
}

function modelUrl(spec: VehicleModelSpec) {
  if (
    spec.src.startsWith('data:') ||
    spec.src.startsWith('blob:') ||
    spec.src.startsWith('http://') ||
    spec.src.startsWith('https://')
  ) {
    return spec.src
  }
  return spec.id === '1965-ford-mustang-coupe' ? mustangUrl : spec.src
}

function applyPose(root: Group, spec: VehicleModelSpec, pose: VehicleModelPose) {
  const hood = root.getObjectByName(spec.hood)
  const trunk = root.getObjectByName(spec.trunk)
  const doorL = root.getObjectByName(spec.doorL)
  const doorR = root.getObjectByName(spec.doorR)
  if (hood) hood.rotation.z = pose.hoodOpen ? 0.85 : 0
  if (trunk) trunk.rotation.z = pose.trunkOpen ? -0.95 : 0
  if (doorL) doorL.rotation.y = pose.doorLOpen ? -1.05 : 0
  if (doorR) doorR.rotation.y = pose.doorROpen ? 1.05 : 0
}

function useStudioFloor(tokens: ThemeTokens) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const wash = ctx.createRadialGradient(256, 256, 24, 256, 256, 260)
    wash.addColorStop(0, tokens.gridCenter)
    wash.addColorStop(0.42, tokens.gridMid)
    wash.addColorStop(1, tokens.gridEdge)
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = tokens.gridLine
    ctx.lineWidth = 1
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 512)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
    }
    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.anisotropy = 4
    return texture
  }, [tokens])
}

function StudioReflections({ tokens }: { tokens: ThemeTokens }) {
  return (
    <Environment key={tokens.reflectBase} resolution={256} frames={1}>
      <color attach="background" args={[tokens.reflectBase]} />
      <Lightformer form="rect" intensity={2.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} position={[0, 4, -6]} scale={[12, 2, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[-6, 2.5, 2]} rotation-y={Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[6, 2.5, -2]} rotation-y={-Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer form="ring" intensity={0.9} color={tokens.rimColor} position={[4, 3, 6]} scale={3} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color={tokens.reflectFloor} />
      </mesh>
    </Environment>
  )
}

function Studio({ tokens }: { tokens: ThemeTokens }) {
  const floor = useStudioFloor(tokens)
  return (
    <>
      <StudioReflections tokens={tokens} />
      <color attach="background" args={[tokens.background]} />
      <fog attach="fog" args={[tokens.background, tokens.fogNear, tokens.fogFar]} />
      <hemisphereLight args={[tokens.sky, tokens.ground, tokens.hemi]} />
      <ambientLight intensity={tokens.ambient} />
      <directionalLight
        position={[6.2, 8.4, 4.6]}
        intensity={tokens.key}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00025}
      />
      <directionalLight
        position={[-5.5, 3.2, -4.2]}
        intensity={tokens.rim}
        color={tokens.rimColor}
      />
      <spotLight
        position={[0.4, 7.2, 2.2]}
        angle={0.55}
        penumbra={0.85}
        intensity={tokens.spot}
        distance={18}
        color={tokens.spotColor}
        castShadow
      />

      <mesh position={[0, 2.4, 0]} receiveShadow>
        <cylinderGeometry args={[12, 12, 9, 48, 1, true]} />
        <meshStandardMaterial
          color={tokens.cove}
          side={BackSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial
          color={tokens.floor}
          map={floor ?? undefined}
          roughness={0.88}
          metalness={0.08}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.705, 0]} receiveShadow>
        <circleGeometry args={[2.55, 72]} />
        <meshStandardMaterial color={tokens.platform} roughness={0.32} metalness={0.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.698, 0]}>
        <ringGeometry args={[2.5, 2.64, 72]} />
        <meshStandardMaterial color={tokens.ring} roughness={0.28} metalness={0.62} />
      </mesh>

      <mesh position={[-2.1, 5.6, -1.4]} rotation={[Math.PI / 2.6, 0.15, 0.1]}>
        <planeGeometry args={[3.4, 0.55]} />
        <meshBasicMaterial color={tokens.barA} />
      </mesh>
      <mesh position={[2.4, 5.5, -0.6]} rotation={[Math.PI / 2.5, -0.2, -0.08]}>
        <planeGeometry args={[2.6, 0.4]} />
        <meshBasicMaterial color={tokens.barB} />
      </mesh>
    </>
  )
}

function Model({
  spec,
  color,
  pose,
  onProgress,
}: {
  spec: VehicleModelSpec
  color?: string | null
  pose: VehicleModelPose
  onProgress: (event: ProgressEvent) => void
}) {
  const gltf = useLoader(GLTFLoader, modelUrl(spec), undefined, onProgress)
  const root = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    cloned.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (!mesh.name.startsWith('Paint_') || !color) return
      const source = mesh.material
      const list = Array.isArray(source) ? source : [source]
      const next = list.map((material) => {
        const clonedMat = material.clone() as MeshStandardMaterial
        if ('color' in clonedMat) clonedMat.color = new Color(color)
        return clonedMat
      })
      mesh.material = Array.isArray(source) ? next : next[0]
    })
    return cloned
  }, [gltf.scene, color])

  useEffect(() => {
    applyPose(root, spec, pose)
  }, [root, spec, pose.hoodOpen, pose.trunkOpen, pose.doorLOpen, pose.doorROpen])

  return (
    <Center top>
      <primitive object={root} />
    </Center>
  )
}

function LoadingSignal({ onChange }: { onChange: (loading: boolean) => void }) {
  useEffect(() => {
    onChange(true)
    return () => onChange(false)
  }, [onChange])
  return null
}

function CaptureRegistrar({
  active,
  onCaptureReady,
}: {
  active: boolean
  onCaptureReady?: (capture: (() => string) | null) => void
}) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    if (!onCaptureReady) return
    if (!active) {
      onCaptureReady(null)
      return
    }
    onCaptureReady(() => {
      gl.render(scene, camera)
      return gl.domElement.toDataURL('image/jpeg', 0.92)
    })
    return () => onCaptureReady(null)
  }, [active, camera, gl, onCaptureReady, scene])

  return null
}

function LoadingOverlay({ progress }: { progress: number | null }) {
  const percent = progress == null ? null : Math.round(progress * 100)
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex w-44 flex-col items-center gap-2 rounded-sm border border-garage-border bg-garage-panel/90 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-garage-text">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading model{percent == null ? '…' : ` ${percent}%`}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-garage-text/70 transition-[width] duration-200"
            style={{ width: `${percent ?? 15}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function VehicleModelViewer({
  spec,
  color,
  autoRotate = true,
  pose = {},
  className,
  showControls = true,
  onCaptureReady,
}: VehicleModelViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [theme, setTheme] = useStudioTheme()
  const tokens = THEMES[theme]
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    setProgress(null)
  }, [spec?.src])

  function handleProgress(event: ProgressEvent) {
    if (event.lengthComputable && event.total > 0) setProgress(event.loaded / event.total)
  }

  function zoom(direction: 'in' | 'out') {
    const controls = controlsRef.current
    if (!controls) return
    if (direction === 'in') controls.dollyOut(ZOOM_STEP)
    else controls.dollyIn(ZOOM_STEP)
    controls.update()
  }

  const captureActive = Boolean(spec) && !loading

  return (
    <div
      className={`relative w-full ${className ?? 'h-72 md:h-80'}`}
      style={{ background: tokens.background }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [5.4, 1.85, 3.6], fov: 32 }}
        gl={{ antialias: true, alpha: false }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Studio tokens={tokens} />
        {spec ? (
          <Suspense fallback={<LoadingSignal onChange={setLoading} />}>
            <group position={[0, -0.7, 0]}>
              <Model spec={spec} color={color} pose={pose} onProgress={handleProgress} />
            </group>
          </Suspense>
        ) : null}
        <ContactShadows
          position={[0, -0.69, 0]}
          opacity={tokens.shadow}
          scale={8}
          blur={2.2}
          far={4.5}
        />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.15}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          maxPolarAngle={Math.PI / 2.08}
          target={[0, 0.32, 0]}
        />
        <CaptureRegistrar active={captureActive} onCaptureReady={onCaptureReady} />
      </Canvas>
      {(loading || !spec) && <LoadingOverlay progress={spec ? progress : null} />}
      {showControls ? (
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-sm border border-garage-border bg-garage-panel/90 text-garage-text shadow-lg backdrop-blur-sm hover:bg-white/10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light studio' : 'Switch to dark studio'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <div className="flex flex-col overflow-hidden rounded-sm border border-garage-border bg-garage-panel/90 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            className="flex size-9 items-center justify-center text-garage-text hover:bg-white/10"
            onClick={() => zoom('in')}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center border-t border-garage-border text-garage-text hover:bg-white/10"
            onClick={() => zoom('out')}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
        </div>
      </div>
      ) : null}
    </div>
  )
}

useLoader.preload(GLTFLoader, mustangUrl)
