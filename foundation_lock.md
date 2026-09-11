# FreeWorld — Foundation Lock & Architectural Inventory (v5.0)

## 1. Coordinate System Conventions
- **World Space**: Right-handed Three.js coordinate system.
  - `+X`: East / Right
  - `+Y`: Up / Elevation
  - `+Z`: South / Back
  - `-Z`: North / Forward
- **Local Space**:
  - Local Forward: `-Z` vector (`new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion)`)
  - Local Right: `+X` vector (`new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion)`)
  - Local Up: `+Y` vector (`new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion)`)

## 2. Core Subsystem Inventory & File Map
| Subsystem | Core Files | Responsibility |
| :--- | :--- | :--- |
| **Core** | `EventBus.js`, `GameState.js`, `EntityManager.js`, `CollisionSystem.js`, `Engine.js`, `AssetManager.js`, `InputManager.js`, `ObjectPool.js`, `PerformanceManager.js` | Central event broker, global state machine, entity lookup, spatial hash grid, game loop, input routing, memory pooling. |
| **World** | `CityBuilder.js`, `NavigationGraph.js`, `PropSystem.js`, `PropPlacer.js`, `SectorManager.js`, `DistrictManager.js`, `LODManager.js`, `Sectors.js`, `WorldSimulation.js` | Procedural city layout, waypoint navigation, destructible props, streaming grid, simulation LOD. |
| **Player** | `PlayerController.js`, `PlayerModel.js`, `PlayerState.js`, `CameraController.js`, `InteractionSystem.js` | On-foot character controller, animation rig, camera tracking, contextual interaction prompts. |
| **Vehicles** | `VehicleBase.js`, `VehiclePhysics.js`, `VehicleAI.js`, `VehicleTypes.js`, `VehicleDamage.js`, `VehicleManager.js` | Weight transfer, drivetrain gear shift, pure pursuit pathfinding, deformation, damage model. |
| **NPC** | `NPCBrain.js`, `NPCPerception.js`, `NPCMemory.js`, `NPCModel.js`, `NPCBase.js`, `CivilianAI.js`, `PedestrianManager.js`, `NPCSchedule.js`, `NPCManager.js` | Civilian state machines, perception cones, memory graphs, ragdoll/death logic. |
| **Police** | `PoliceAI.js`, `PoliceManager.js`, `WantedSystem.js`, `WitnessSystem.js`, `EvidenceSystem.js`, `SearchSystem.js`, `PoliceDispatch.js`, `ArrestSystem.js` | Investigation scoring, 1-5 star wanted system, pursuit AI, surrender window, BUSTED reset. |
| **Combat** | `WeaponSystem.js`, `ProjectileManager.js`, `HitReaction.js` | Raycast hitscan ballistics, spread bloom, reload state machine, limb reaction triggers. |
| **Audio** | `SoundEngine.js`, `RadioSystem.js` | Web Audio procedural synthesis (engines, sirens, crashes, gunshots). |
| **Weather** | `TimeManager.js`, `WeatherManager.js` | Solar orbital position, day/night lighting curves, rain sheen, lightning flashes. |
| **UI** | `HUDManager.js`, `Minimap.js`, `Smartphone.js`, `ShopUI.js` | Real-time heads-up display, radar minimap, smartphone apps, armory store. |
| **SaveSystem** | `SaveManager.js` | Structured `localStorage` persistence (player vitals, cash, warrants, time). |
| **Tools** | `DebugConsole.js`, `PerformanceStats.js`, `WorldInspector.js` | Developer cheats, telemetry overlay, spatial debug bounds. |

## 3. Foundation Lock Rules
1. **Zero Destructive Refactoring**: Working subsystems must be extended, never discarded.
2. **Backward Compatibility**: All existing event signals and API entry points remain functional.
3. **Decoupled Architecture**: Subsystems communicate strictly through `EventBus` signals.
