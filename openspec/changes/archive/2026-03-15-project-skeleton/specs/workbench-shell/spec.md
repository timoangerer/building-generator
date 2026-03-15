## ADDED Requirements

### Requirement: React app with Three.js canvas
The workbench SHALL be a React application that renders a Three.js scene in a canvas element. It SHALL call the orchestrator pipeline on mount with a default config and seed.

#### Scenario: Workbench renders on load
- **WHEN** the workbench is opened in a browser via `npm run dev`
- **THEN** a Three.js canvas SHALL be visible with rendered geometry

### Requirement: Building volume rendering
The workbench SHALL render each building from the SceneResult as box meshes corresponding to the building's massing footprint and height. Buildings SHALL use `MeshToonMaterial` for the stylized look.

#### Scenario: Buildings visible as 3D volumes
- **WHEN** the scene contains buildings with massing data
- **THEN** each building SHALL be rendered as a visible 3D box mesh

### Requirement: Street rendering
The workbench SHALL render streets from the SceneResult as flat plane meshes on the ground (y=0).

#### Scenario: Streets visible as ground planes
- **WHEN** the scene contains streets
- **THEN** each street SHALL be rendered as a flat plane at ground level

### Requirement: Camera controls
The workbench SHALL provide OrbitControls allowing the user to rotate, zoom, and pan the camera around the scene.

#### Scenario: User can orbit the scene
- **WHEN** the user clicks and drags on the canvas
- **THEN** the camera SHALL orbit around the scene center

### Requirement: Visual style
The workbench SHALL use a dark background and warm directional lighting to match the project's visual direction.

#### Scenario: Dark background with warm lighting
- **WHEN** the workbench renders
- **THEN** the background SHALL be dark and directional light SHALL have a warm tone
