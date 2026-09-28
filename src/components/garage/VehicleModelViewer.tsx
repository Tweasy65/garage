import { Center, ContactShadows, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { Color } from 'three'

import type { VehicleModelSpec } from '@/data/vehicleModels'
import mustangUrl from '@/assets/models/1965-ford-mustang-coupe.glb?url'

export type VehicleModelPose = {
  hoodOpen?: boolean
  trunkOpen?: boolean
  doorLOpen?: boolean
  doorROpen?: boolean
}

type VehicleModelViewerProps = {
  spec: VehicleModelSpec
  color?: string | null
  autoRotate?: boolean
  pose?: VehicleModelPose
  className?: string
}

function modelUrl(spec: VehicleModelSpec) {
  return spec.id === '1965-ford-mustang-coupe' ? mustangUrl : spec.src
}

function applyPose(root: Group, spec: VehicleModelSpec, pose: VehicleModelPose) {
  const hood = root.getObjectByName(spec.hood)
  const trunk = root.getObjectByName(spec.trunk)
  const doorL = root.getObjectByName(spec.doorL)
  const doorR = root.getObjectByName(spec.doorR)
  if (hood) hood.rotation.z = pose.hoodOpen ? -0.85 : 0
  if (trunk) trunk.rotation.z = pose.trunkOpen ? 0.95 : 0
  if (doorL) doorL.rotation.y = pose.doorLOpen ? -1.05 : 0
  if (doorR) doorR.rotation.y = pose.doorROpen ? 1.05 : 0
}

function Model({
  spec,
  color,
  pose,
}: {
  spec: VehicleModelSpec
  color?: string | null
  pose: VehicleModelPose
}) {
  const gltf = useGLTF(modelUrl(spec))
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
    <Center>
      <primitive object={root} />
    </Center>
  )
}

export default function VehicleModelViewer({
  spec,
  color,
  autoRotate = true,
  pose = {},
  className,
}: VehicleModelViewerProps) {
  return (
    <div className={`relative w-full bg-[#141416] ${className ?? 'h-72 md:h-80'}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [5.4, 1.8, 3.6], fov: 32 }}
        gl={{ antialias: true, alpha: false }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#141416']} />
        <hemisphereLight args={['#c8d0dc', '#1a1a1a', 0.7]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 7, 4]} intensity={1.8} castShadow />
        <directionalLight position={[-5, 2, -3]} intensity={0.45} />
        <Suspense fallback={null}>
          <group position={[0, 0.05, 0]}>
            <Model spec={spec} color={color} pose={pose} />
          </group>
        </Suspense>
        <ContactShadows opacity={0.55} scale={12} blur={2.4} far={6} />
        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1.15}
          minDistance={3.2}
          maxDistance={11}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.35, 0]}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload(mustangUrl)
