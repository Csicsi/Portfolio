import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF, Bounds, Sky } from '@react-three/drei';
import { EffectComposer, GodRays } from '@react-three/postprocessing';
import * as THREE from 'three';

function useCameraAnimator() {
  const { camera, size } = useThree();
  const controlsRef = useRef(null);

  const [anim, setAnim] = useState(null);
  useFrame((_, delta) => {
    if (!anim) return;
    const { fromPos, toPos, fromTarget, toTarget } = anim;
    const speed = 2.2;
    const t = Math.min(anim.t + delta / speed, 1);
    const pos = new THREE.Vector3().lerpVectors(fromPos, toPos, t);
    const tgt = new THREE.Vector3().lerpVectors(fromTarget, toTarget, t);
    camera.position.copy(pos);
    if (controlsRef.current) {
      controlsRef.current.target.copy(tgt);
      controlsRef.current.update();
    }
    if (t >= 1) setAnim(null);
    else setAnim({ ...anim, t });
  });

  const startAnim = (toPos, toTarget) => {
    setAnim({
      fromPos: camera.position.clone(),
      toPos: toPos.clone ? toPos.clone() : new THREE.Vector3(...toPos),
      fromTarget: controlsRef.current ? controlsRef.current.target.clone() : new THREE.Vector3(),
      toTarget: toTarget.clone ? toTarget.clone() : new THREE.Vector3(...toTarget),
      t: 0,
    });
  };

  const frameBox = (box, fovDeg = camera.fov) => {
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg * 0.5)));
    const fitWidthDistance = fitHeightDistance / (size.x / size.y || 1);
    const distance = 1.25 * Math.max(fitHeightDistance, fitWidthDistance); // padding

    const dir = new THREE.Vector3()
      .subVectors(camera.position, controlsRef.current?.target ?? new THREE.Vector3())
      .normalize();

    const newPos = new THREE.Vector3().addVectors(center, dir.multiplyScalar(distance));
    startAnim(newPos, center);
  };

  const resetView = (
    position = new THREE.Vector3(2.6, 1.6, 3),
    target = new THREE.Vector3(0, 1, 0)
  ) => {
    startAnim(position, target);
  };

  return { controlsRef, frameBox, resetView };
}

function RoomModelInteractive(props) {
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
      if (groupName) {
        groupObjects[groupName].roots.push(o);
      }
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

  const { controlsRef, frameBox, resetView } = useCameraAnimator();
  const computeGroupBox = (groupName) => {
    const entry = groupObjects[groupName];
    const box = new THREE.Box3();
    entry?.roots.forEach((root) => box.expandByObject(root));
    return box;
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

    if (mode === 'out') {
      setHoverGroup(rootToGroup.get(rootName), true);
    } else {
      setHoverObject(e.object, true);
    }
  };

  const handleOut = (e) => {
    e.stopPropagation();
    if (mode === 'out') {
      Object.keys(groups).forEach((g) => setHoverGroup(g, false));
    } else {
      setHoverObject(e.object, false);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const rootName = findRootName(e.object);
    if (!rootName) return;
    const groupName = rootToGroup.get(rootName);
    if (!groupName) return;

    if (mode === 'out') {
      const box = computeGroupBox(groupName);
      frameBox(box);
      setMode('in');
      setActiveGroup(groupName);
      clearAllHighlights();
    } else if (mode === 'in') {
      if (groupName !== activeGroup) {
        const box = computeGroupBox(groupName);
        frameBox(box);
        setActiveGroup(groupName);
        clearAllHighlights();
      } else {
        console.log(`Clicked object: ${e.object.name} (group: ${groupName})`);
      }
    }
  };

  return (
    <primitive
      object={scene}
      {...props}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onPointerMissed={() => {
        // Reset to zoomed out
        clearAllHighlights();
        setMode('out');
        setActiveGroup(null);
        resetView();
      }}
    />
  );
}

useGLTF.preload('/models/room.glb');

export default function App() {
  const sunRef = useRef();
  const sunPos = [-12, 10, 3];
  const { controlsRef } = (() => ({}))();

  return (
    <div style={{ width: '100vw', height: '100dvh' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [2.6, 1.6, 3], fov: 50, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
      >
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

        <OrbitControls
          ref={(ref) => (window.__controlsRef = ref)}
          makeDefault
          target={[0, 1, 0]}
          enableDamping
        />

        <Suspense fallback={<Html center>Loading room…</Html>}>
          <Bounds fit clip observe margin={1.2}>
            <RoomModelInteractive />
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
