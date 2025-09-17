import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  useGLTF,
  Bounds,
} from '@react-three/drei';

function RoomModel(props) {
  const { scene } = useGLTF('/models/room.glb');

  scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return <primitive object={scene} {...props} />;
}

useGLTF.preload('/models/room.glb');

export default function App() {
  return (
    <div className="w-screen h-screen">
      <Canvas shadows camera={{ position: [3, 2, 4], fov: 50, near: 0.1, far: 100 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <OrbitControls makeDefault target={[0, 1, 0]} />

        <Suspense fallback={<Html center>Loading room…</Html>}>
          <Bounds fit clip observe margin={1.2}>
            <RoomModel />
          </Bounds>
          <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={10} blur={2.5} far={10} />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
