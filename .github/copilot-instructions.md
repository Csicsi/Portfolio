# Copilot Instructions

## Project Overview

This is a React Three.js portfolio showcasing an interactive 3D room with camera presets, hover interactions, and postprocessing effects. The architecture separates concerns between camera control, 3D model interaction, and visual effects.

## Key Architecture Patterns

### Three.js Integration via R3F

- Uses `@react-three/fiber` (R3F) as the React renderer for Three.js
- All Three.js components must be inside `<Canvas>` to access R3F hooks like `useThree()`, `useFrame()`
- Critical: R3F hooks cannot be used outside `<Canvas>` - this is why `CameraController` lives inside the Canvas

### Camera System Architecture

The camera system is split across three coordinated files:

- `src/camera/presets.tsx`: Static camera positions with orbital constraints (azimuth/polar angles)
- `src/camera/CameraController.tsx`: Headless component handling smooth camera animations and OrbitControls limits
- `src/camera/CameraReadout.tsx`: Debug overlay showing current camera state

Pattern: CameraController exposes imperative API via `useImperativeHandle` for parent components to trigger preset changes.

### 3D Model Interaction Pattern

`RoomModelInteractive.tsx` implements a sophisticated interaction system:

- Groups GLB root nodes into logical areas (workstation, makerbay, server, shelf)
- Dynamic hover highlighting: group-level when zoomed out, object-level when zoomed in
- Uses `rootToGroup` reverse mapping to identify which group a clicked mesh belongs to
- Integrates with camera system via `onGoToGroup` callback

## Development Workflow

### Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run Vitest tests
npm run test:run     # Single test run
npm run lint         # ESLint check
npm run format       # Format with Prettier
```

### Testing Setup

- Uses Vitest with jsdom environment for React component testing
- `setupTests.ts` includes ResizeObserver polyfill for Three.js compatibility
- Tests are minimal but focus on rendering validation

### Code Quality

- ESLint config uses flat config format with React, import, and unused-imports plugins
- Prettier integration via lint-staged for pre-commit formatting
- Husky handles git hooks for automated code quality checks

## Project-Specific Conventions

### Component Documentation

Every major component includes extensive JSDoc comments explaining:

- Purpose and architectural role
- Key design decisions and constraints
- Integration points with other components

### 3D Scene Configuration

- Sun position `[-12, 10, 3]` drives both Sky component and GodRays postprocessing
- Shadow settings are tuned for this specific room scale (shadow-camera bounds, bias)
- Canvas uses `powerPreference: 'high-performance'` for better GPU utilization

### State Management

- Minimal React state - most 3D state handled by Three.js/R3F internally
- Uses refs extensively for imperative APIs between React and Three.js systems
- No external state management (Redux, Zustand) - appropriate for single-scene portfolio

### File Organization

```
src/
├── camera/          # Camera system (presets, controller, debug)
├── components/      # 3D components (model interaction)
└── assets/          # Static assets referenced by Vite
```

## Integration Points

### Model Loading

- GLB model expected at `/public/models/room.glb`
- Model structure assumption: root nodes named as defined in `groups` object in `RoomModelInteractive`
- Uses R3F `<Suspense>` pattern with loading fallback

### Performance Optimizations

- `frustumCulled={false}` on sun mesh for consistent GodRays effect
- Canvas `dpr={[1, 2]}` for device pixel ratio optimization
- Conditional GodRays rendering based on sun mesh readiness

When modifying this codebase, maintain the separation between React state management and Three.js scene manipulation, and ensure all Three.js-dependent code remains within the Canvas boundary.
