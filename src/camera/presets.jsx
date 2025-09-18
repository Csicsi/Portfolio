import {
  Suspense,
  useRef,
  useMemo,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF, Bounds, Sky } from '@react-three/drei';
import { EffectComposer, GodRays } from '@react-three/postprocessing';
import * as THREE from 'three';

// -------------------- CAMERA PRESETS --------------------
export const CAMERA_PRESETS = {
  overview: {
    position: [2.6, 1.6, 3.0],
    target: [0, 1, 0],
    azimuthBaseDeg: 13,
    azimuthSpreadDeg: 20,
    polarBaseDeg: 25,
    polarSpreadDeg: 15,
  },
  workstation: {
    position: [1.8, 1.4, 1.4],
    target: [0.6, 1.0, 0.1],
    azimuthBaseDeg: 18,
    azimuthSpreadDeg: 10,
    polarBaseDeg: 22,
    polarSpreadDeg: 10,
  },
  makerbay: {
    position: [-1.4, 1.5, 1.6],
    target: [-0.6, 1.0, 0.1],
    azimuthBaseDeg: 5,
    azimuthSpreadDeg: 10,
    polarBaseDeg: 28,
    polarSpreadDeg: 10,
  },
  server: {
    position: [0.4, 1.6, -1.8],
    target: [0.2, 1.1, -0.4],
    azimuthBaseDeg: -35,
    azimuthSpreadDeg: 8,
    polarBaseDeg: 30,
    polarSpreadDeg: 8,
  },
  shelf: {
    position: [-2.2, 1.5, -0.5],
    target: [-0.9, 1.1, 0.0],
    azimuthBaseDeg: -10,
    azimuthSpreadDeg: 10,
    polarBaseDeg: 26,
    polarSpreadDeg: 10,
  },
};

const deg = (d) => THREE.MathUtils.degToRad(d);

// -------------------- CAMERA CONTROLLER (inside Canvas) --------------------
const CameraController = forwardRef(function CameraController({ controlsRef }, ref) {
  const { camera } = useThree();
  const animRef = useRef(null);

  useFrame((_, delta) => {
    const anim = animRef.current;
    if (!anim) return;
    const { fromPos, toPos, fromTarget, toTarget, duration, t } = anim;
    const nt = Math.min(t + delta / duration, 1);

    const pos = new THREE.Vector3().lerpVectors(fromPos, toPos, nt);
    const tgt = new THREE.Vector3().lerpVectors(fromTarget, toTarget, nt);

    camera.position.copy(pos);
    camera.up.set(0, 1, 0);

    if (controlsRef?.current) {
      controlsRef.current.target.copy(tgt);
      controlsRef.current.update();
    }

    animRef.current = nt >= 1 ? null : { ...anim, t: nt };
  });

  const startAnim = (toPos, toTarget, duration = 0.9) => {
    const fromPos = camera.position.clone();
    const fromTarget = controlsRef?.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3();

    const toP = toPos.clone ? toPos.clone() : new THREE.Vector3(...toPos);
    const toT = toTarget.clone ? toTarget.clone() : new THREE.Vector3(...toTarget);

    animRef.current = { fromPos, toPos: toP, fromTarget, toTarget: toT, duration, t: 0 };
  };

  const applyViewPreset = (name, { animate = true } = {}) => {
    const p = CAMERA_PRESETS[name];
    if (!p) return;

    // Update orbit spreads to base ± spread for this preset
    if (controlsRef?.current) {
      controlsRef.current.minAzimuthAngle = deg(p.azimuthBaseDeg - p.azimuthSpreadDeg);
      controlsRef.current.maxAzimuthAngle = deg(p.azimuthBaseDeg + p.azimuthSpreadDeg);
      controlsRef.current.minPolarAngle = deg(Math.max(0, p.polarBaseDeg - p.polarSpreadDeg));
      controlsRef.current.maxPolarAngle = deg(Math.min(179.9, p.polarBaseDeg + p.polarSpreadDeg));
      controlsRef.current.update();
    }

    if (animate) startAnim(p.position, p.target, 0.9);
    else {
      camera.position.set(...p.position);
      if (controlsRef?.current) {
        controlsRef.current.target.set(...p.target);
        controlsRef.current.update();
      }
    }
  };

  useImperativeHandle(ref, () => ({ applyViewPreset }));
  return null;
});

// -------------------- ROOM MODEL --------------------
function RoomModelInteractive({ onGoToGroup }) {
  const { scene } = useGLTF('/models/room.glb');

  const groups = useMemo(
    () => ({
      workstation: ['desk', 'gameboy', 'lamp', 'PC'],
      makerbay: ['maker', 'arduino', 'printer'],
      server: ['server'],
      shelf: ['shelf'],
    }),
    []
  );

  const rootToGroup = useMemo(() => {
    const map = new Map();
    Object.entries(groups).forEach(([g, roots]) => roots.forEach((r) => map.set(r, g)));
    return map;
  }, [groups]);

  const groupObjects = useMemo(() => {
    const out = {};
    Object.keys(groups).forEach((g) => (out[g] = { roots: [], meshes: [] }));
    return out;
  }, [groups]);

  useEffect(() => {
    scene.traverse((o) => {
      if (!o.name) return;
      const groupName = rootToGroup.get(o.name);
      if (groupName) groupObjects[groupName].roots.push(o);
    });

    Object.values(groupObjects).forEach(({ roots, meshes }) => {
      roots.forEach((root) => {
        root.traverse((o) => {
          if (o.isMesh) {
            if (!o.userData._matCloned && o.material) {
              o.material = o.material.clone();
              o.userData._matCloned = true;
            }
            if (!o.userData._orig) {
              const mat = o.material;
              o.userData._orig = {
                hasEmissive: !!mat?.emissive,
                emissive: mat?.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
                emissiveIntensity: mat?.emissiveIntensity ?? 0,
              };
            }
            meshes.push(o);
          }
        });
      });
    });
  }, [scene, rootToGroup, groupObjects]);

  const [mode, setMode] = useState('out');
  const [activeGroup, setActiveGroup] = useState(null);

  const highlightMeshes = (meshes, on) => {
    for (const m of meshes) {
      const mat = m.material;
      if (!mat) continue;
      if (on) {
        if (!mat.emissive) mat.emissive = new THREE.Color(0, 0, 0);
        mat.emissive.setRGB(0.15, 0.15, 0.15);
        mat.emissiveIntensity = 0.8;
      } else if (m.userData._orig) {
        if (!mat.emissive && m.userData._orig.hasEmissive) {
          mat.emissive = m.userData._orig.emissive.clone();
        } else if (mat.emissive) {
          mat.emissive.copy(m.userData._orig.emissive);
        }
        mat.emissiveIntensity = m.userData._orig.emissiveIntensity;
      }
    }
  };

  const clearAllHighlights = () => {
    Object.values(groupObjects).forEach(({ meshes }) => highlightMeshes(meshes, false));
    document.body.style.cursor = 'auto';
  };

  const setHoverGroup = (groupName, on) => {
    const entry = groupObjects[groupName];
    if (!entry) return;
    highlightMeshes(entry.meshes, on);
    document.body.style.cursor = on ? 'pointer' : 'auto';
  };

  const setHoverObject = (mesh, on) => {
    highlightMeshes([mesh], on);
    document.body.style.cursor = on ? 'pointer' : 'auto';
  };

  const findRootName = (obj) => {
    let p = obj;
    while (p) {
      if (rootToGroup.has(p.name)) return p.name;
      p = p.parent;
    }
    return null;
  };

  const handleOver = (e) => {
    e.stopPropagation();
    const rootName = findRootName(e.object);
    if (!rootName) return;
    if (mode === 'out') setHoverGroup(rootToGroup.get(rootName), true);
    else setHoverObject(e.object, true);
  };

  const handleOut = (e) => {
    e.stopPropagation();
    if (mode === 'out') Object.keys(groups).forEach((g) => setHoverGroup(g, false));
    else setHoverObject(e.object, false);
  };

  const goOverview = () => {
    clearAllHighlights();
    setMode('out');
    setActiveGroup(null);
    onGoToGroup('overview');
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const rootName = findRootName(e.object);
    if (!rootName) return;
    const groupName = rootToGroup.get(rootName);
    if (!groupName) return;

    if (mode === 'out') {
      onGoToGroup(groupName); // zoom into group
      setMode('in');
      setActiveGroup(groupName);
      clearAllHighlights();
    } else {
      if (groupName !== activeGroup) {
        onGoToGroup(groupName); // switch between groups while zoomed
        setActiveGroup(groupName);
        clearAllHighlights();
      }
    }
  };

  return (
    <>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onPointerMissed={goOverview}
      />
      {/* Small overlay Close button when zoomed in */}
      {mode === 'in' && (
        <Html fullscreen zIndexRange={[100, 100]}>
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 20,
              lineHeight: '36px',
              cursor: 'pointer',
              userSelect: 'none',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            }}
            title="Back to overview"
            onClick={goOverview}
          >
            ×
          </div>
        </Html>
      )}
    </>
  );
}

useGLTF.preload('/models/room.glb');

// -------------------- APP --------------------
export default function App() {
  const sunRef = useRef();
  const sunPos = [-12, 10, 3];
  const controlsRef = useRef(null);
  const cameraCtrlRef = useRef(null);

  const goTo = (name) => cameraCtrlRef.current?.applyViewPreset(name);

  return (
    <div style={{ width: '100vw', height: '100dvh' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: CAMERA_PRESETS.overview.position, fov: 50, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        onCreated={() => cameraCtrlRef.current?.applyViewPreset('overview', { animate: false })}
      >
        {/* Camera controller (must be inside Canvas) */}
        <CameraController ref={cameraCtrlRef} controlsRef={controlsRef} />

        <ambientLight intensity={0.1} />
        <directionalLight
          position={sunPos}
          intensity={2.4}
          color="#fff4d6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <Sky
          sunPosition={sunPos}
          turbidity={4}
          rayleigh={1.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.9}
        />
        <mesh ref={sunRef} position={sunPos} frustumCulled={false}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* OrbitControls — limits are updated per preset by CameraController */}
        <OrbitControls ref={controlsRef} makeDefault enableDamping />

        <Suspense fallback={<Html center>Loading room…</Html>}>
          <Bounds fit clip observe margin={1.2}>
            <RoomModelInteractive onGoToGroup={goTo} />
          </Bounds>
        </Suspense>

        <EffectComposer>
          {sunRef.current && (
            <GodRays
              sun={sunRef.current}
              samples={60}
              density={0.9}
              decay={0.95}
              weight={0.3}
              exposure={0.6}
              clampMax={1.0}
              blur
            />
          )}
        </EffectComposer>
      </Canvas>
    </div>
  );
}
