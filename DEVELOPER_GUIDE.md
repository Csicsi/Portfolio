# Developer Guide for C/C++/Python Programmers

## Overview

This is a React + Three.js 3D portfolio application. If you're coming from C/C++/Python, think of it as:

- **React**: UI framework (like Qt or Tkinter, but for web)
- **Three.js**: 3D graphics library (like OpenGL/DirectX wrapper)
- **Vite**: Build system (like CMake or Make)
- **TypeScript**: JavaScript with types (like C++ with better type checking)

## Core Architecture

### Component Hierarchy (Like Class Inheritance)

```
App (main entry point)
├── CameraReadout (debug overlay - outside 3D scene)
├── Close Button (UI overlay - outside 3D scene)
└── Canvas (3D rendering context)
    ├── CameraController (handles camera animation)
    ├── Lights (ambient + directional)
    ├── Sky (procedural sky)
    ├── Sun Mesh (for post-processing effects)
    ├── OrbitControls (mouse/touch camera control)
    ├── RoomModelInteractive (loads 3D model + handles clicks)
    └── EffectComposer (post-processing effects)
```

### Data Flow (Like Function Calls)

1. User clicks 3D object → RoomModelInteractive detects click
2. RoomModelInteractive calls `onGoToGroup('workstation')` → App receives callback
3. App calls `cameraCtrlRef.current.applyViewPreset('workstation')` → CameraController
4. CameraController animates camera to preset position
5. App updates `isZoomedIn` state → Close button appears/disappears

## Key Concepts for C/C++/Python Developers

### React Concepts

#### Components = Classes/Functions

```tsx
// Like a class with a render() method
function MyComponent({ prop1, prop2 }) {
  return <div>Hello {prop1}</div>;
}

// Usage (like instantiating a class)
<MyComponent prop1="world" prop2={42} />;
```

#### State = Reactive Variables

```tsx
// Like a variable that triggers re-rendering when changed
const [count, setCount] = useState(0);

// To change: setCount(count + 1)
// When count changes, component re-renders automatically
```

#### useRef = Persistent Pointers

```tsx
// Like a pointer that doesn't change between renders
const myRef = useRef(null);

// Access: myRef.current
// Useful for DOM elements or calling methods on child components
```

#### useEffect = Constructor/Destructor

```tsx
// Runs when component mounts (like constructor)
useEffect(() => {
  console.log('Component mounted');

  // Cleanup function (like destructor)
  return () => {
    console.log('Component unmounting');
  };
}, []); // Empty array = run once on mount
```

### Three.js Concepts

#### Scene Graph = Tree Structure

```
Scene (root)
├── Camera (viewpoint)
├── Lights (illumination)
├── Meshes (visible objects)
│   ├── Geometry (shape/vertices)
│   └── Material (surface properties)
└── Groups (organization)
```

#### Coordinates System

- **X**: left (-) to right (+)
- **Y**: down (-) to up (+)
- **Z**: into screen (-) to out of screen (+)

**Coordinate System:**

- **Origin [0,0,0]**: Back wall center, floor level (model's natural origin)
- **Camera targets**: Usually point toward the front of the room (positive Z values)
- **Benefits**: Intuitive coordinates, no camera pivot issues when orbiting

#### Animation = Interpolation

```tsx
// Linear interpolation (lerp): start + (end - start) * t
// where t goes from 0.0 to 1.0 over time
const currentPos = startPos.lerp(endPos, t);
```

## File Structure & Responsibilities

### Main Files

- **`src/App.tsx`**: Main component, sets up 3D scene
- **`src/camera/presets.tsx`**: Camera position definitions
- **`src/camera/CameraController.tsx`**: Camera animation logic
- **`src/components/RoomModelInteractive.tsx`**: 3D model loading + interaction

### Configuration Files

- **`package.json`**: Dependencies and scripts (like requirements.txt)
- **`vite.config.js`**: Build configuration (like CMakeLists.txt)
- **`tsconfig.json`**: TypeScript settings (like compiler flags)

## Common Modifications

### Adding New Camera Positions

1. **Explore the scene** manually with mouse controls
2. **Press 'P'** when you find a good view (copies to clipboard)
3. **Add to presets.tsx**:

```tsx
export const CAMERA_PRESETS = {
  // existing presets...

  mynewview: {
    position: [x, y, z], // From camera readout
    target: [x, y, z], // From camera readout
  },
};
```

4. **Update group mappings** in RoomModelInteractive.tsx if needed:

```tsx
const groups = useMemo(
  () => ({
    // existing groups...
    mynewarea: ['object1', 'object2'], // Names from GLB file
  }),
  []
);
```

### Changing Lighting

In `src/App.tsx`, modify:

```tsx
// Sun position affects both sky and lighting
const sunPos: [number, number, number] = [-12, 10, 3];

// Ambient light (overall brightness)
<ambientLight intensity={0.1} />

// Directional light (like sunlight)
<directionalLight
  position={sunPos}
  intensity={2.4}        // Brightness
  color="#fff4d6"        // Color (hex)
  castShadow            // Enable shadows
/>
```

### Modifying Visual Effects

In `src/App.tsx`, adjust GodRays:

```tsx
<GodRays
  samples={60} // Quality (higher = better/slower)
  density={0.9} // Thickness of rays
  decay={0.95} // Fade with distance
  weight={0.3} // Overall intensity
  exposure={0.6} // Brightness
/>
```

### Adding New 3D Objects

1. **Add to GLB file** using Blender or similar 3D software
2. **Name root objects** descriptively in your 3D software
3. **Note**: Model origin is at back wall center, floor level - the `<Bounds>` component handles centering
4. **Update group mappings** in RoomModelInteractive.tsx:

```tsx
const groups = useMemo(
  () => ({
    workstation: ['desk', 'gameboy', 'lamp', 'PC', 'mynewobject'],
    // or create new group
    newarea: ['mynewobject'],
  }),
  []
);
```

### Changing Animation Speed

In `src/camera/CameraController.tsx`:

```tsx
// Change default duration (0.9 seconds)
startAnim(p.position, p.target, 1.5); // Slower
startAnim(p.position, p.target, 0.5); // Faster
```

## Build Commands

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Code formatting
npm run format

# Linting (code quality checks)
npm run lint
```

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes** to source files
3. **Browser auto-refreshes** (hot reload)
4. **Use browser dev tools** (F12) for debugging
5. **Check console** for errors/warnings

## Common Debugging

### 3D Issues

- **Objects not visible**: Check if they're inside camera frustum (near/far planes)
- **Lighting too dark**: Increase ambient light intensity
- **Shadows not working**: Ensure objects have `castShadow` and `receiveShadow`
- **Coordinate confusion**: Remember model origin ≠ scene origin due to `<Bounds>` centering

### React Issues

- **Component not updating**: Check if you're mutating state directly (use setState)
- **"Hook outside Canvas" error**: Move Three.js hooks inside `<Canvas>`
- **Performance issues**: Use `useMemo` and `useCallback` for expensive operations

### Camera Issues

- **Animation not smooth**: Check if preset positions are too far apart
- **Can't orbit**: Verify OrbitControls limits aren't too restrictive
- **Wrong view**: Use CameraReadout (press 'P') to check current position

## Understanding the Codebase

The app follows these patterns:

- **Separation of concerns**: UI, 3D logic, and data are separate
- **Event-driven**: User actions trigger callbacks that update state
- **Declarative**: Describe what UI should look like, React handles updates
- **Component composition**: Small, focused components combined into larger ones

Think of it like a well-structured C++ program with classes for different responsibilities, but instead of inheritance, we use composition and props/callbacks for communication.
