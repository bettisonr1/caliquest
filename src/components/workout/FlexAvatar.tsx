'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group, MeshStandardMaterial } from 'three'
import type { MuscleGroup } from '@/types/database'

// Matches the muscle-group chip colors used across the app (tailwind 400 shades).
const groupColors: Record<MuscleGroup, string> = {
  pull:     '#60a5fa',
  push:     '#fb923c',
  core:     '#facc15',
  legs:     '#34d399',
  mobility: '#c084fc',
}

const restColor = '#8a94a5'

type MusclePartProps = {
  group: MuscleGroup
  worked: Set<MuscleGroup>
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  children: React.ReactNode
}

/** A body-part mesh that pulses in its muscle-group color when that group was worked. */
function MusclePart({ group, worked, children, ...meshProps }: MusclePartProps) {
  const material = useRef<MeshStandardMaterial>(null)
  const active = worked.has(group)

  useFrame(({ clock }) => {
    if (!material.current || !active) return
    material.current.emissiveIntensity = 0.55 + 0.4 * Math.sin(clock.elapsedTime * 5)
  })

  return (
    <mesh {...meshProps}>
      {children}
      <meshStandardMaterial
        ref={material}
        color={active ? groupColors[group] : restColor}
        emissive={active ? groupColors[group] : '#000000'}
        emissiveIntensity={active ? 0.55 : 0}
        roughness={0.55}
        metalness={0.15}
      />
    </mesh>
  )
}

function RestPart({ children, ...meshProps }: Omit<MusclePartProps, 'group' | 'worked'>) {
  return (
    <mesh {...meshProps}>
      {children}
      <meshStandardMaterial color={restColor} roughness={0.55} metalness={0.15} />
    </mesh>
  )
}

/** One arm in a front-double-biceps pose. `side` is 1 for right (+x), -1 for left. */
function Arm({ side, worked, forearmRef }: {
  side: 1 | -1
  worked: Set<MuscleGroup>
  forearmRef: React.RefObject<Group | null>
}) {
  return (
    <group position={[side * 0.46, 1.0, 0]} rotation={[0, 0, side * -0.22]}>
      {/* Deltoid */}
      <MusclePart group="push" worked={worked} position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </MusclePart>
      {/* Upper arm, roughly horizontal */}
      <RestPart position={[side * 0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.085, 0.24, 8, 16]} />
      </RestPart>
      {/* Biceps bulge */}
      <MusclePart group="pull" worked={worked} position={[side * 0.2, 0.08, 0]} scale={[1.2, 0.85, 0.95]}>
        <sphereGeometry args={[0.105, 24, 24]} />
      </MusclePart>
      {/* Forearm curls up from the elbow; rotation animated for the flex pump */}
      <group ref={forearmRef} position={[side * 0.38, 0, 0]}>
        <RestPart position={[0, 0.15, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 8, 16]} />
        </RestPart>
        <RestPart position={[0, 0.31, 0]}>
          <sphereGeometry args={[0.085, 20, 20]} />
        </RestPart>
      </group>
    </group>
  )
}

function Figure({ worked }: { worked: Set<MuscleGroup> }) {
  const body = useRef<Group>(null)
  const leftForearm = useRef<Group>(null)
  const rightForearm = useRef<Group>(null)

  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const pop = 1 - Math.pow(1 - Math.min(1, t / 0.45), 3)
    const pump = reduceMotion ? 0 : Math.sin(t * 5) * 0.5 + 0.5

    if (body.current) {
      body.current.scale.setScalar(reduceMotion ? 1 : pop)
      body.current.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.22
      body.current.position.y = -0.15 + (reduceMotion ? 0 : pump * 0.03)
    }
    const curl = 0.28 + pump * 0.22
    if (rightForearm.current) rightForearm.current.rotation.z = curl
    if (leftForearm.current) leftForearm.current.rotation.z = -curl
  })

  return (
    <group ref={body} position={[0, -0.15, 0]}>
      {/* Head + neck */}
      <RestPart position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.19, 24, 24]} />
      </RestPart>
      <RestPart position={[0, 1.22, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 16]} />
      </RestPart>

      {/* Traps */}
      <MusclePart group="pull" worked={worked} position={[0.2, 1.12, 0]} scale={[1.2, 0.7, 1]}>
        <sphereGeometry args={[0.09, 20, 20]} />
      </MusclePart>
      <MusclePart group="pull" worked={worked} position={[-0.2, 1.12, 0]} scale={[1.2, 0.7, 1]}>
        <sphereGeometry args={[0.09, 20, 20]} />
      </MusclePart>

      {/* Chest */}
      <RestPart position={[0, 0.82, 0]} scale={[1.55, 1.05, 0.85]}>
        <sphereGeometry args={[0.26, 24, 24]} />
      </RestPart>
      <MusclePart group="push" worked={worked} position={[0.14, 0.86, 0.17]} scale={[1.1, 0.85, 0.55]}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </MusclePart>
      <MusclePart group="push" worked={worked} position={[-0.14, 0.86, 0.17]} scale={[1.1, 0.85, 0.55]}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </MusclePart>

      {/* Abs / core */}
      <MusclePart group="core" worked={worked} position={[0, 0.42, 0]} scale={[1.15, 1.5, 0.75]}>
        <sphereGeometry args={[0.21, 24, 24]} />
      </MusclePart>

      {/* Pelvis */}
      <RestPart position={[0, 0.02, 0]} scale={[1.35, 0.75, 0.9]}>
        <sphereGeometry args={[0.2, 24, 24]} />
      </RestPart>

      <Arm side={1} worked={worked} forearmRef={rightForearm} />
      <Arm side={-1} worked={worked} forearmRef={leftForearm} />

      {/* Legs */}
      {([1, -1] as const).map(side => (
        <group key={side}>
          <MusclePart group="legs" worked={worked} position={[side * 0.17, -0.42, 0]}>
            <capsuleGeometry args={[0.11, 0.36, 8, 16]} />
          </MusclePart>
          <MusclePart group="legs" worked={worked} position={[side * 0.17, -0.92, 0]}>
            <capsuleGeometry args={[0.08, 0.3, 8, 16]} />
          </MusclePart>
          <RestPart position={[side * 0.17, -1.17, 0.06]}>
            <boxGeometry args={[0.16, 0.09, 0.3]} />
          </RestPart>
        </group>
      ))}

      {/* Ground ring — pulses purple for mobility work */}
      <MusclePart group="mobility" worked={worked} position={[0, -1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.025, 12, 48]} />
      </MusclePart>
    </group>
  )
}

/**
 * Celebratory low-poly avatar shown on workout completion.
 * Flexes a front double-biceps pose and pulses the muscle groups
 * that were worked in their group colors.
 */
export function FlexAvatar({ workedGroups }: { workedGroups: MuscleGroup[] }) {
  const worked = useMemo(() => new Set(workedGroups), [workedGroups])

  return (
    <div className="h-56 w-full" aria-hidden>
      <Canvas camera={{ position: [0, 0.05, 4.4], fov: 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.3} />
        <directionalLight position={[-3, 1.5, -2]} intensity={0.35} />
        <Figure worked={worked} />
      </Canvas>
    </div>
  )
}
