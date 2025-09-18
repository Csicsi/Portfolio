/**
 * RoomModelInteractive
 * --------------------
 * Loads your GLB room scene and adds interaction:
 *  - Hover highlight: group-level when zoomed out; object-level when zoomed in.
 *  - Click a group to zoom to its preset via onGoToGroup(groupName).
 *  - Click the "×" overlay (or miss the model) to return to 'overview'.
 *
 * Assumptions:
 *  - Top-level group nodes in the GLB have names listed in `groups` below.
 *  - Meshes inherit those names somewhere in their parent chain.
 *
 * Why so many comments?
 *  - To make later tweaks easier (materials, groups, UI).
 */

import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo, useState } from 'react';

export default function RoomModelInteractive({ onGoToGroup }) {
  // Load the glTF scene once. (R3F Suspense above handles the loading state.)
  const { scene } = useGLTF('/models/room.glb');

  /**
   * Map your GLB **root names** (first-level nodes) to logical groups.
   * Edit the string lists to match the root node names in your GLB.
   */
  const groups = useMemo(
    () => ({
      workstation: ['desk', 'gameboy', 'lamp', 'PC'],
      makerbay: ['maker', 'arduino', 'printer'],
      server: ['server'],
      shelf: ['shelf'],
    }),
    []
  );

  // Reverse lookup: root name -> group name
  const rootToGroup = useMemo(() => {
    const map = new Map();
    Object.entries(groups).forEach(([g, roots]) => roots.forEach((r) => map.set(r, g)));
    return map;
  }, [groups]);

  /**
   * groupObjects structure:
   * {
   *   [groupName]: { roots: THREE.Object3D[], meshes: THREE.Mesh[] }
   * }
   * We populate this once after glTF traversal for fast lookup later.
   */
  const groupObjects = useMemo(() => {
    const out = {};
    Object.keys(groups).forEach((g) => (out[g] = { roots: [], meshes: [] }));
    return out;
  }, [groups]);

  // Traverse glTF once to assign roots and capture meshes with a *cloned* material
  useEffect(() => {
    scene.traverse((o) => {
      if (!o.name) return;
      const groupName = rootToGroup.get(o.name);
      if (groupName) groupObjects[groupName].roots.push(o);
    });

    // For each root, collect all meshes and clone materials so we can safely mutate emissive
    Object.values(groupObjects).forEach(({ roots, meshes }) => {
      roots.forEach((root) => {
        root.traverse((o) => {
          if (o.isMesh) {
            // Clone the material once to avoid changing shared instances
            if (!o.userData._matCloned && o.material) {
              o.material = o.material.clone();
              o.userData._matCloned = true;
            }
            // Stash original emissive values so we can restore them
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

  // Interaction mode: 'out' (group hover) vs 'in' (object hover)
  const [mode, setMode] = useState('out');
  const [activeGroup, setActiveGroup] = useState(null);

  /** Toggle emissive highlight for a list of meshes */
  const highlightMeshes = (meshes, on) => {
    for (const m of meshes) {
      const mat = m.material;
      if (!mat) continue;

      if (on) {
        if (!mat.emissive) mat.emissive = new THREE.Color(0, 0, 0);
        // Subtle warm-ish highlight; tweak values here
        mat.emissive.setRGB(0.15, 0.15, 0.15);
        mat.emissiveIntensity = 0.8;
      } else if (m.userData._orig) {
        // Restore exact original emissive settings
        if (!mat.emissive) {
          // Initialize to a clone of the original, or a default color if not available
          mat.emissive = m.userData._orig.hasEmissive && m.userData._orig.emissive
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

  /** Remove all highlights and reset cursor */
  const clearAllHighlights = () => {
    Object.values(groupObjects).forEach(({ meshes }) => highlightMeshes(meshes, false));
    document.body.style.cursor = 'auto';
  };

  /** Hover helpers */
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

  /** Walk up the parent chain to find the root name that belongs to a group */
  const findRootName = (obj) => {
    let p = obj;
    while (p) {
      if (rootToGroup.has(p.name)) return p.name;
      p = p.parent;
    }
    return null;
  };

  // Pointer events
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

  /** Return to overview */
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
      // First click from overview → zoom into group
      onGoToGroup(groupName);
      setMode('in');
      setActiveGroup(groupName);
      clearAllHighlights();
    } else {
      // Already zoomed: clicking another group switches focus
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
        onPointerMissed={goOverview} // clicking empty space returns to overview
      />

      {mode === 'in' && (
        <Html fullscreen zIndexRange={[100, 100]}>
          <div
            title="Back to overview"
            onClick={goOverview}
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
          >×</div>
        </Html>
      )}
    </>
  );
}

// Let R3F warm the cache before first render (optional but nice).
useGLTF.preload('/models/room.glb');
