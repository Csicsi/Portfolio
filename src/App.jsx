import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function SpinningBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
    </mesh>
  );
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <SpinningBox /> {/* */}
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
