import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF, Bounds, Sky } from '@react-three/drei';
import { EffectComposer, GodRays } from '@react-three/postprocessing';
import * as THREE from 'three';

function RoomModelInteractive(props) {
  const { scene } = useGLTF('/models/room.glb');

  // Group names you want clickable
  const clickableNames = useMemo(
    () =>
      new Set(['arduino', 'desk', 'gameboy', 'lamp', 'maker', 'PC', 'printer', 'server', 'shelf']),
    []
  );

  const findNamedAncestor = (o) => {
    let p = o;
    while (p) {
      if (clickableNames.has(p.name)) return p;
      p = p.parent;
    }
    return null;
  };

  const getHighlightMeshes = (node) => {
    const meshes = [];
    if (!node) return meshes;
    node.traverse?.((o) => {
      if (o.isMesh) meshes.push(o);
    });
    if (meshes.length === 0 && node.isMesh) meshes.push(node);
    return meshes;
  };

  // 🔧 One-time fix: detach shared materials for meshes under clickable groups
  useEffect(() => {
    const hasClickableAncestor = (o) => {
      let p = o;
      while (p) {
        if (clickableNames.has(p.name)) return true;
        p = p.parent;
      }
      return false;
    };

    scene.traverse((o) => {
      if (!o.isMesh) return;
      if (!hasClickableAncestor(o)) return;

      // Clone material once to avoid shared-state highlighting
      if (!o.userData._matCloned && o.material) {
        o.material = o.material.clone();
        o.userData._matCloned = true;
      }

      // Prepare original emissive snapshot for restore
      const mat = o.material;
      if (mat && !o.userData._orig) {
        o.userData._orig = {
          hasEmissive: !!mat.emissive,
          emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
          emissiveIntensity: mat.emissiveIntensity ?? 0,
        };
      }
    });
  }, [scene, clickableNames]);

  const setHoverForNode = (node, hovering) => {
    const meshes = getHighlightMeshes(node);
    if (meshes.length === 0) return;

    document.body.style.cursor = hovering ? 'pointer' : 'auto';

    for (const m of meshes) {
      const mat = m.material;
      if (!mat) continue;

      // Ensure emissive exists when highlighting
      if (hovering) {
        if (!mat.emissive) mat.emissive = new THREE.Color(0, 0, 0);
        mat.emissive.setRGB(0.15, 0.15, 0.15);
        mat.emissiveIntensity = 0.8;
      } else if (m.userData._orig) {
        // Restore per-mesh original values
        if (!mat.emissive && m.userData._orig.hasEmissive) {
          mat.emissive = m.userData._orig.emissive.clone();
        } else if (mat.emissive) {
          mat.emissive.copy(m.userData._orig.emissive);
        }
        mat.emissiveIntensity = m.userData._orig.emissiveIntensity;
      }
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const target = findNamedAncestor(e.object);
    if (!target) return;

    switch (target.name) {
      case 'server':
        console.log('Server clicked! Maybe open your homelab page');
        break;
      case 'arduino':
        console.log('Arduino clicked! Could open a project detail');
        break;
      case 'desk':
        console.log('Desk clicked!');
        break;
      case 'gameboy':
        console.log('Gameboy clicked! Could open retro gaming page');
        break;
      case 'lamp':
        console.log('Lamp clicked! Maybe toggle light on/off');
        break;
      case 'maker':
        console.log('Maker clicked! Could open maker projects page');
        break;
      case 'PC':
        console.log('PC clicked! Could open portfolio or about me page');
        break;
      case 'printer':
        console.log('Printer clicked! Could open 3D printing projects page');
        break;
      case 'shelf':
        console.log('Shelf clicked! Could open bookshelf or reading list page');
        break;
      default:
    }
  };

  const handleOver = (e) => {
    e.stopPropagation();
    const target = findNamedAncestor(e.object);
    if (target) setHoverForNode(target, true);
  };

  const handleOut = (e) => {
    e.stopPropagation();
    const target = findNamedAncestor(e.object);
    if (target) setHoverForNode(target, false);
  };

  return (
    <primitive
      object={scene}
      {...props}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onPointerMissed={() => {
        document.body.style.cursor = 'auto';
      }}
    />
  );
}

useGLTF.preload('/models/room.glb');

export default function App() {
  const sunRef = useRef();
  const sunPos = [-12, 10, 3];

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

        <OrbitControls makeDefault target={[0, 1, 0]} enableDamping />

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
