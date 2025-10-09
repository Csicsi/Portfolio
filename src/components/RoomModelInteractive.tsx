/**
 * ================================================================================
 * ROOM MODEL INTERACTIVE - 3D Model Loading and User Interaction Handler
 * ================================================================================
 *
 * FOR C/C++/Python DEVELOPERS:
 * This component is like a 3D model loader + event handler system in a game engine.
 * It loads a 3D model file and makes objects clickable and hoverable.
 *
 * KEY CONCEPTS:
 * - 3D Model Loading: Like loading .obj/.fbx files in 3D software
 * - Event Handling: Mouse/touch events on 3D objects (raycasting)
 * - State Machine: Tracks interaction mode (overview vs zoomed-in)
 * - Object Grouping: Organizes 3D objects into logical interaction areas
 *
 * ARCHITECTURE:
 * 1. Load 3D model from GLB file (like loading game assets)
 * 2. Parse model hierarchy and group objects by functionality
 * 3. Handle user input (hover/click) with visual feedback
 * 4. Communicate with parent component to trigger camera changes
 *
 * 3D MODEL STRUCTURE:
 * - GLB file contains a hierarchy of 3D objects (scene graph)
 * - Objects are grouped by root node names (like folders in file system)
 * - We map these technical names to logical groups (workstation, server, etc.)
 *
 * INTERACTION MODES:
 * - 'out' (overview): Hover highlights entire groups, click zooms to group
 * - 'in' (zoomed): Hover highlights individual objects, click switches groups
 */

// React Three Fiber GLB loader for 3D model files
import { useGLTF } from '@react-three/drei';
// Three.js for 3D math and object manipulation
import * as THREE from 'three';
// React hooks for state management and side effects
import { useEffect, useMemo, useState } from 'react';

/**
 * MAIN COMPONENT FUNCTION
 *
 * PROPS EXPLANATION:
 * - onGoToGroup: Callback function to tell parent to switch camera to specific area
 * - onGoToOverview: Callback function to tell parent to return to overview camera
 *
 * Think of callbacks like function pointers passed from parent to child
 */
export default function RoomModelInteractive({ onGoToGroup, onGoToOverview }) {
  // ============================================================================
  // 3D MODEL LOADING
  // ============================================================================

  /**
   * LOAD GLB 3D MODEL FILE
   *
   * GLB = Binary format for 3D models (like .exe for .cpp source)
   * Contains meshes, materials, textures, animations in one file
   *
   * useGLTF() is like fopen() for 3D models - loads asynchronously
   * The Suspense component in App.tsx shows loading screen while this loads
   */
  const { scene } = useGLTF('/models/room.glb');

  // ============================================================================
  // OBJECT GROUPING SYSTEM
  // ============================================================================

  /**
   * GROUP MAPPING CONFIGURATION
   *
   * PURPOSE:
   * Maps technical 3D object names to logical interaction groups
   * Like mapping file names to program modules
   *
   * STRUCTURE:
   * - Key: logical group name (used for camera presets)
   * - Value: array of root object names in the 3D model
   *
   * USAGE:
   * When user clicks on 'desk', system knows it belongs to 'workstation' group
   * and can trigger the 'workstation' camera preset
   *
   * TO MODIFY: Match these names to your GLB file's root object names
   */
  const groups = useMemo(
    () => ({
      workstation: ['desk', 'gameboy', 'lamp', 'PC'], // Computer/desk area objects
      makerbay: ['maker', 'arduino', 'printer'], // Electronics/3D printing area
      server: ['server'], // Server rack area
      shelf: ['shelf'], // Storage/display area
    }),
    [] // Empty dependency array = computed once and cached
  );

  /**
   * REVERSE LOOKUP MAP
   *
   * PURPOSE:
   * Quick lookup to find which group an object belongs to
   * Like a hash table for O(1) lookups instead of linear search
   *
   * EXAMPLE:
   * rootToGroup.get('desk') returns 'workstation'
   * rootToGroup.get('printer') returns 'makerbay'
   */
  const rootToGroup = useMemo(() => {
    const map = new Map();
    // For each group, add all its objects to the reverse lookup
    Object.entries(groups).forEach(([groupName, rootNames]) =>
      rootNames.forEach((rootName) => map.set(rootName, groupName))
    );
    return map;
  }, [groups]);

  // ============================================================================
  // 3D OBJECT ANALYSIS AND CACHING
  // ============================================================================

  /**
   * PROCESSED OBJECT GROUPS DATA STRUCTURE
   *
   * PURPOSE:
   * Pre-processes the 3D model to organize objects by group for fast interaction
   * Think of this like building an index for a database
   *
   * STRUCTURE:
   * {
   *   workstation: {
   *     roots: [desk_object, lamp_object, PC_object],      // Top-level objects
   *     meshes: [desk_mesh1, desk_mesh2, lamp_mesh1, ...]  // All renderable meshes
   *   },
   *   makerbay: { roots: [...], meshes: [...] },
   *   ...
   * }
   *
   * WHY CACHE THIS:
   * - 3D model traversal is expensive (like walking a file system tree)
   * - We do it once on load, then use cached results for fast hover/click
   * - Separates "roots" (logical objects) from "meshes" (what user sees/clicks)
   */
  const groupObjects = useMemo(() => {
    const out = {};
    // Initialize empty arrays for each group
    Object.keys(groups).forEach((g) => (out[g] = { roots: [], meshes: [] }));
    return out;
  }, [groups]);

  // ============================================================================
  // MODEL PROCESSING - Parse 3D hierarchy and organize objects
  // ============================================================================

  /**
   * PROCESS 3D MODEL ON LOAD
   *
   * PURPOSE:
   * Walks through the entire 3D model hierarchy and organizes objects by groups
   * Think of this like building an index after loading a large dataset
   *
   * TWO-PHASE PROCESS:
   * 1. Find root objects (top-level objects that match our group names)
   * 2. Traverse each root to find all child meshes (the actual visible geometry)
   *
   * USEEFFECT EXPLANATION:
   * - Runs when component mounts or scene changes
   * - Like a constructor or initialization function
   * - Dependency [scene] means it runs when the 3D model finishes loading
   */
  useEffect(() => {
    // PHASE 1: Find root objects by walking the entire scene
    scene.traverse((o) => {
      // Skip objects without names (they can't be mapped to groups)
      if (!o.name) return;

      // Check if this object name matches any of our defined groups
      const groupName = rootToGroup.get(o.name);
      if (groupName) groupObjects[groupName].roots.push(o);
    });

    // PHASE 2: For each root object, find all child meshes and prepare them for interaction
    Object.values(groupObjects).forEach(({ roots, meshes }) => {
      roots.forEach((root) => {
        // Traverse each root's children to find all meshes (visible geometry)
        root.traverse((o) => {
          if (o.isMesh) {
            /**
             * MATERIAL CLONING FOR HOVER EFFECTS
             *
             * PROBLEM:
             * Multiple objects might share the same material (like a texture)
             * If we modify a shared material, ALL objects using it change
             *
             * SOLUTION:
             * Clone the material for each mesh so we can modify it independently
             * This is like making a copy of a struct before modifying it
             */
            if (!o.userData._matCloned && o.material) {
              o.material = o.material.clone(); // Create independent copy
              o.userData._matCloned = true; // Mark as already cloned
            }

            /**
             * BACKUP ORIGINAL MATERIAL PROPERTIES
             *
             * PURPOSE:
             * Store original material values so we can restore them when hover ends
             * Like storing register values before modifying them in assembly
             */
            if (!o.userData._orig) {
              const mat = o.material;
              o.userData._orig = {
                hasEmissive: !!mat?.emissive, // Does material have emissive property?
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
    onGoToOverview();
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
    </>
  );
}

// Let R3F warm the cache before first render (optional but nice).
useGLTF.preload('/models/room.glb');
