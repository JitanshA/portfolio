"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, type ErrorInfo, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { chartToWorld, worldToChart, destinationDepth, HERO_VIEW, LAUNCH_POINT, type LaunchAnchorRef, type SpaceDestination, type SpaceRef } from "./hero-space";

const MODEL_URL = "/models/satellite_dish.glb";
const TELESCOPE_LEFT_PX = 107;
const ROCKET_SCALE = 1.3;
// Presentation heading: 60° from viewer-facing +Z toward chart-right +X.
// The asset's front is -Z, hence the additional 180° model rotation.
const REST_YAW = THREE.MathUtils.degToRad(240);
const REST_ELEVATION = THREE.MathUtils.degToRad(38);
const MIN_ELEVATION = THREE.MathUtils.degToRad(8);
const MAX_ELEVATION = THREE.MathUtils.degToRad(66);

type CoreSceneProps = { state: SpaceRef; launchAnchorRef: LaunchAnchorRef; destinations: SpaceDestination[]; active: boolean };
type SceneProps = CoreSceneProps & {
  onReady: () => void;
  onUnavailable: () => void;
  onContextLost: () => void;
  onContextRestored: (modelReady: boolean) => void;
};

function Telescope({ state, active, destinations, launchAnchorRef, onReady }: CoreSceneProps & { onReady: () => void }) {
  const { scene } = useGLTF(MODEL_URL);
  const { size } = useThree();
  const modelRef = useRef<THREE.Group>(null);
  const targetPoint = useRef(new THREE.Vector3());
  const { model, bounds, materials, authoredElevation } = useMemo(() => {
    // Clone the complete scene, retaining every authored transform and mesh.
    const model = scene.clone(true);
    const materials = new Map<THREE.Material, THREE.Material>();
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const grade = (original: THREE.Material) => {
        if (materials.has(original)) return materials.get(original)!;
        const material = original.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.multiply(new THREE.Color("#b3c9df"));
          material.emissiveIntensity = 0.15;
          material.envMapIntensity = 0.65;
        }
        materials.set(original, material);
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(grade) : grade(object.material);
    });
    // Measure the footprint at a fixed calibration angle, independent of the
    // final rest heading, so scale and placement stay stable regardless of
    // the model's presentation rotation. Retain this reference through all
    // subsequent articulation.
    model.rotation.y = Math.PI - 0.55;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model, true);
    // Change the physical heading about the pedestal's upright centreline.
    // Compensate ONLY for that pivot: its world position and ground height stay
    // exactly fixed, rather than re-centring the changing dish bounds.
    const base = model.getObjectByName("Satelite_Base");
    const baseAnchor = base?.getWorldPosition(new THREE.Vector3());
    model.rotation.y = REST_YAW;
    model.updateMatrixWorld(true);
    if (base && baseAnchor) {
      model.position.add(baseAnchor.sub(base.getWorldPosition(new THREE.Vector3())));
      model.updateMatrixWorld(true);
    }
    // Geometry inspection: the shaft's local Z is root -X. Its world centre
    // before presentation is (0, 3.699, .716); the fixed bearing housing is
    // coaxial at (0, 3.710, .719). This is an elevation hinge, not a boresight.
    // Work in their shared authored parent; attach preserves the rest pose.
    const names = ["Dish", "Antena", "Metal Rings", "Sphere", "Dish Rotator"];
    const moving = names.map((name) => model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)));
    const shaft = moving[4];
    const parent = shaft?.parent;
    const boresight = moving[0]
      ? new THREE.Vector3(0, 0, -1).applyQuaternion(moving[0].quaternion)
      : new THREE.Vector3(0, 0, -1);
    const authoredElevation = Math.atan2(boresight.y, -boresight.z);
    if (shaft && parent && moving.every((part) => part?.parent === parent)) {
      const elevation = new THREE.Group();
      elevation.name = "VerifiedElevationHinge";
      elevation.position.copy(shaft.position);
      parent.add(elevation);
      model.updateMatrixWorld(true);
      moving.forEach((part) => elevation.attach(part!));
      elevation.rotation.x = REST_ELEVATION - authoredElevation;
    }
    return { model, bounds, materials, authoredElevation };
  }, [scene]);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  useEffect(() => {
    // Sphere is the authored receiver-tip node, inside the moving elevation
    // assembly. Sample its complete matrixWorld at the instant of activation,
    // including model heading, current elevation, scale and screen placement.
    const receiver = model.getObjectByName("Sphere");
    const world = new THREE.Vector3();
    const sample = () => {
      if (!receiver) return null;
      receiver.getWorldPosition(world);
      return worldToChart(world, size.width / HERO_VIEW.width);
    };
    launchAnchorRef.current = sample;
    onReady();
    return () => {
      launchAnchorRef.current = null;
    };
  }, [model, size.width, launchAnchorRef, onReady]);
  useFrame((_, dt) => {
    const hinge = modelRef.current?.getObjectByName("VerifiedElevationHinge");
    if (!hinge?.parent || !active) return;
    const aim = state.current.aim;
    let elevation = REST_ELEVATION;
    if (aim) {
      const destination = destinations.find((dest) => dest.id === state.current.activeId);
      // Destinations use exactly the same 3D positions as their sphere meshes.
      // Free pointers live on the chart's z=0 plane. Convert the actual vector
      // from the shaft into its parent's coordinates, then project into the
      // physically available Y/-Z elevation plane (shaft is local X).
      targetPoint.current.set(...chartToWorld(destination ?? aim, destination ? destinationDepth(destination) : 0))
        .multiplyScalar(size.width / HERO_VIEW.width);
      hinge.parent.worldToLocal(targetPoint.current);
      targetPoint.current.sub(hinge.position);
      elevation = THREE.MathUtils.clamp(
        Math.atan2(targetPoint.current.y, -targetPoint.current.z), MIN_ELEVATION, MAX_ELEVATION,
      );
    }
    const target = elevation - authoredElevation;
    hinge.rotation.x = THREE.MathUtils.damp(hinge.rotation.x, target, 5, Math.min(dt, 0.05));
  });

  const extent = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const unit = size.width / HERO_VIEW.width;
  const scale = Math.min(330 / extent.x, 340 / extent.y) * unit;
  return (
    <group scale={scale} position={[
      (210 - HERO_VIEW.width / 2) * unit - center.x * scale - TELESCOPE_LEFT_PX,
      (HERO_VIEW.height / 2 - 493) * unit - center.y * scale,
      -center.z * scale,
    ]}>
      <primitive ref={modelRef} object={model} />
    </group>
  );
}

function Planet({ destination, index, state, active }: {
  destination: SpaceDestination; index: number; state: SpaceRef; active: boolean;
}) {
  const mesh = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>>(null);
  const geometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(destination.r, 40, 32);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const base = new THREE.Color(["#405c70", "#465b72", "#537b96", "#3d5667", "#4b626c"][index]);
    const color = new THREE.Color();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / destination.r;
      const y = positions.getY(i) / destination.r;
      const z = positions.getZ(i) / destination.r;
      const bands = Math.sin(y * 19 + Math.sin(x * 7 + z * 5) * 1.5);
      const grain = Math.sin(x * 35 + y * 29) * Math.sin(z * 31 - y * 13);
      color.copy(base).multiplyScalar(0.88 + bands * 0.1 + grain * 0.035);
      color.toArray(colors, i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [destination.r, index]);
  useFrame((_, dt) => {
    if (!mesh.current || !active) return;
    const hovered = state.current.activeId === destination.id;
    mesh.current.rotation.y += Math.min(dt, 0.05) * (0.045 + index * 0.008);
    const scale = THREE.MathUtils.damp(mesh.current.scale.x, hovered ? 1.06 : 1, 8, dt);
    mesh.current.scale.setScalar(scale);
    mesh.current.material.emissiveIntensity = THREE.MathUtils.damp(
      mesh.current.material.emissiveIntensity, hovered ? 0.22 : 0.015, 8, dt,
    );
  });
  return (
    <mesh ref={mesh} position={chartToWorld(destination, destinationDepth(destination))} geometry={geometry} rotation={[0.12, index, -0.2]}>
      <meshStandardMaterial vertexColors roughness={0.78} metalness={0.12} emissive="#6596b5" emissiveIntensity={0.015} />
    </mesh>
  );
}

function Rocket({ state }: { state: SpaceRef }) {
  const rocket = useRef<THREE.Group>(null);
  const exhaust = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null);
  const motion = useRef({ curve: new THREE.CubicBezierCurve3(), point: new THREE.Vector3(), tangent: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) });
  const flightVisuals = useMemo(() => {
    const positions = new Float32Array(24 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const trail = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#8abfdf", transparent: true, opacity: 0.25, depthWrite: false }));
    trail.frustumCulled = false;
    trail.visible = false;
    return trail;
  }, []);
  useEffect(() => () => { flightVisuals.geometry.dispose(); flightVisuals.material.dispose(); }, [flightVisuals]);
  useFrame(() => {
    if (!rocket.current || !trailRef.current) return;
    const flight = state.current.flight;
    const trail = trailRef.current;
    rocket.current.visible = !!flight;
    trail.visible = !!flight;
    if (!flight) return;
    const { curve, point, tangent, up } = motion.current;
    const depth = destinationDepth(flight.dest);
    curve.v0.set(...chartToWorld(flight.p0, flight.p0.z));
    curve.v1.set(...chartToWorld(flight.p1, flight.p0.z + 50));
    curve.v2.set(...chartToWorld(flight.p2, depth + 65));
    curve.v3.set(...chartToWorld(flight.p3, depth));
    curve.getPoint(flight.progress, rocket.current.position);
    curve.getTangent(flight.progress, tangent).normalize();
    rocket.current.quaternion.setFromUnitVectors(up, tangent);
    // Keep a physical size in the same orthographic world as the dish/planets.
    // Taper only at arrival, so the miniature is absorbed by its destination.
    const arrival = 1 - THREE.MathUtils.smoothstep(flight.progress, 0.94, 1);
    rocket.current.scale.setScalar(arrival * ROCKET_SCALE);
    if (exhaust.current) exhaust.current.scale.y = 0.85 + Math.sin(flight.progress * 90) * 0.12;
    const positions = trail.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      curve.getPoint(Math.max(0, flight.progress - i * 0.0035), point);
      positions.setXYZ(i, point.x, point.y, point.z);
    }
    positions.needsUpdate = true;
    trail.material.opacity = 0.25 * arrival;
  });
  return (
    <>
      <primitive ref={trailRef} object={flightVisuals} />
      <group ref={rocket} visible={false}>
        <mesh>
          <cylinderGeometry args={[3.1, 3.1, 13, 16]} />
          <meshStandardMaterial color="#d1dfe7" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 10.5, 0]}>
          <coneGeometry args={[3.1, 8, 16]} />
          <meshStandardMaterial color="#84acc6" roughness={0.45} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.5, 2.8]} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[1.65, 12, 12]} />
          <meshStandardMaterial color="#10293b" metalness={0.65} roughness={0.2} />
        </mesh>
        {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle) => (
          <mesh key={angle} position={[Math.sin(angle) * 3.6, -5, Math.cos(angle) * 3.6]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.8, 7, 5]} />
            <meshStandardMaterial color="#6f96b2" roughness={0.5} metalness={0.25} />
          </mesh>
        ))}
        <mesh position={[0, -7.5, 0]}>
          <cylinderGeometry args={[2, 2.6, 2, 12]} />
          <meshStandardMaterial color="#253a4a" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh ref={exhaust} position={[0, -12.5, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[1.6, 8, 12]} />
          <meshBasicMaterial color="#a4d8f3" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

function SpaceObjects({ state, destinations, active }: Omit<CoreSceneProps, "launchAnchorRef">) {
  const { size } = useThree();
  const unit = size.width / HERO_VIEW.width;
  const padPosition = chartToWorld({ x: LAUNCH_POINT.x, y: LAUNCH_POINT.y + 19.5 }, 60);
  padPosition[0] -= TELESCOPE_LEFT_PX / unit;
  return (
    <group scale={unit}>
      {destinations.map((destination, index) => <Planet key={destination.id} destination={destination} index={index} state={state} active={active} />)}
      <mesh position={padPosition}>
        <cylinderGeometry args={[11, 13, 3, 24]} />
        <meshStandardMaterial color="#293c4a" metalness={0.45} roughness={0.7} />
      </mesh>
      <Rocket state={state} />
    </group>
  );
}

function ContextLifecycle({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const gl = useThree((three) => three.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    const handleRestored = () => onRestored();
    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl, onLost, onRestored]);

  return null;
}

class SceneErrorBoundary extends Component<{
  children: ReactNode;
  onError: () => void;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("The interactive telescope scene could not load.", error, info);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function TelescopeScene3D({
  state, launchAnchorRef, destinations, active,
  onReady, onUnavailable, onContextLost, onContextRestored,
}: SceneProps) {
  const modelReady = useRef(false);
  const createRenderer = useCallback((parameters: THREE.WebGLRendererParameters) => {
    try {
      return new THREE.WebGLRenderer({ ...parameters, alpha: true, antialias: true });
    } catch (error) {
      // Canvas creates its renderer before the R3F scene mounts, so failures at
      // this point cannot be reported by a component inside the scene graph.
      // Notify the parent on the next microtask so it can reveal the SVG
      // fallback and unmount the failed Canvas cleanly.
      queueMicrotask(onUnavailable);
      throw error;
    }
  }, [onUnavailable]);
  const handleReady = useCallback(() => {
    modelReady.current = true;
    onReady();
  }, [onReady]);
  const handleRestored = useCallback(() => {
    onContextRestored(modelReady.current);
  }, [onContextRestored]);

  return (
    <div className="tsc-dish-canvas" aria-hidden="true">
      <SceneErrorBoundary onError={onUnavailable}>
        <Canvas
          orthographic
          gl={createRenderer}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 500], near: 0.1, far: 1000 }}
          frameloop={active ? "always" : "demand"}
        >
          <ContextLifecycle onLost={onContextLost} onRestored={handleRestored} />
          <hemisphereLight args={["#c4def4", "#111e30", 1.1]} />
          <directionalLight position={[-200, 300, 300]} intensity={2} color="#d4e9ff" />
          <directionalLight position={[200, 80, -200]} intensity={1} color="#729cc4" />
          <Suspense fallback={null}>
            <Environment resolution={128}>
              <Lightformer intensity={2} color="#c4def4" position={[-4, 3, 2]} scale={6} />
              <Lightformer intensity={0.5} color="#426488" position={[4, 1, -3]} scale={8} />
            </Environment>
            <Telescope state={state} launchAnchorRef={launchAnchorRef} destinations={destinations} active={active} onReady={handleReady} />
          </Suspense>
          <SpaceObjects state={state} destinations={destinations} active={active} />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
