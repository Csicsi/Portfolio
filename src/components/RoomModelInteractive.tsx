import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useState } from 'react';

interface RoomModelInteractiveProps {
  onGoToGroup: (groupName: string) => void;
  onGoToOverview: () => void;
  isZoomedIn?: boolean;
}

export default function RoomModelInteractive({
  onGoToGroup,
  onGoToOverview,
  isZoomedIn,
}: RoomModelInteractiveProps) {
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
    Object.entries(groups).forEach(([groupName, rootNames]) =>
      rootNames.forEach((rootName) => map.set(rootName, groupName))
    );
    return map;
  }, [groups]);

  type GroupObjectsType = Record<string, { roots: THREE.Object3D[]; meshes: THREE.Mesh[] }>;

  const groupObjects = useMemo((): GroupObjectsType => {
    const out: GroupObjectsType = {};
    Object.keys(groups).forEach((g) => (out[g] = { roots: [], meshes: [] }));
    return out;
  }, [groups]);

  useEffect(() => {
    scene.traverse((o) => {
      if (!o.name) return;

      const groupName = rootToGroup.get(o.name);
      if (groupName && groupObjects[groupName]) {
        groupObjects[groupName].roots.push(o);
      }
    });

    Object.values(groupObjects).forEach(({ roots, meshes }) => {
      roots.forEach((root) => {
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            const mesh = o as THREE.Mesh;
            if (!mesh.userData._matCloned && mesh.material) {
              mesh.material = Array.isArray(mesh.material)
                ? mesh.material.map((m) => m.clone())
                : mesh.material.clone();
              mesh.userData._matCloned = true;
            }

            if (!mesh.userData._orig) {
              const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
              mesh.userData._orig = {
                hasEmissive: !!(mat as any)?.emissive,
                emissive: (mat as any)?.emissive
                  ? (mat as any).emissive.clone()
                  : new THREE.Color(0, 0, 0),
                emissiveIntensity: (mat as any)?.emissiveIntensity ?? 0,
              };
            }
            meshes.push(mesh);
          }
        });
      });
    });
  }, [scene, rootToGroup, groupObjects]);

  const [mode, setMode] = useState<'out' | 'in'>('out');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const highlightMeshes = (meshes: THREE.Mesh[], on: boolean) => {
    for (const m of meshes) {
      const mat = m.material as any;
      if (!mat) continue;

      if (on) {
        if (!mat.emissive) mat.emissive = new THREE.Color(0, 0, 0);
        mat.emissive.setRGB(0.15, 0.15, 0.15);
        mat.emissiveIntensity = 0.8;
      } else if (m.userData._orig) {
        if (!mat.emissive) {
          mat.emissive =
            m.userData._orig.hasEmissive && m.userData._orig.emissive
              ? m.userData._orig.emissive.clone()
              : new THREE.Color(0, 0, 0);
        }
        if (m.userData._orig.hasEmissive && m.userData._orig.emissive) {
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

  const setHoverGroup = (groupName: string, on: boolean) => {
    const entry = groupObjects[groupName];
    if (!entry) return;
    highlightMeshes(entry.meshes, on);
    document.body.style.cursor = on ? 'pointer' : 'auto';
  };

  const setHoverObject = (mesh: THREE.Mesh, on: boolean) => {
    highlightMeshes([mesh], on);
    document.body.style.cursor = on ? 'pointer' : 'auto';
  };

  const findRootName = (obj: THREE.Object3D): string | null => {
    let p: THREE.Object3D | null = obj;
    while (p) {
      if (rootToGroup.has(p.name)) return p.name;
      p = p.parent;
    }
    return null;
  };

  const handleOver = (e: any) => {
    e.stopPropagation();
    const rootName = findRootName(e.object);
    if (!rootName) return;
    if (mode === 'out') setHoverGroup(rootToGroup.get(rootName) || '', true);
    else setHoverObject(e.object as THREE.Mesh, true);
  };

  const handleOut = (e: any) => {
    e.stopPropagation();
    if (mode === 'out') Object.keys(groups).forEach((g) => setHoverGroup(g, false));
    else setHoverObject(e.object as THREE.Mesh, false);
  };

  useEffect(() => {
    if (typeof isZoomedIn === 'boolean' && !isZoomedIn) {
      clearAllHighlights();
      setMode('out');
      setActiveGroup(null);
    }
  }, [isZoomedIn]);

  const goOverview = () => {
    clearAllHighlights();
    setMode('out');
    setActiveGroup(null);
    onGoToOverview();
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    const rootName = findRootName(e.object);
    if (!rootName) return;
    const groupName = rootToGroup.get(rootName);
    if (!groupName) return;

    if (mode === 'out') {
      onGoToGroup(groupName);
      setMode('in');
      setActiveGroup(groupName);
      clearAllHighlights();
    } else {
      if (groupName !== activeGroup) {
        onGoToGroup(groupName);
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
    </>
  );
}

useGLTF.preload('/models/room.glb');
