# FREEWORLD — ULTIMATE REAL-CITY APOCALYPSE
## IMPLEMENTATION MASTER PLAN v1.1

This master document establishes the authoritative, standardized 12-block technical blueprint for evolving the existing **FreeWorld** engine into a persistent, living-city survival experience following the completed Phase 0 foundation audit.

---

## 🏛️ Architectural Core Principles & 5-Layer System Architecture

```text
                                    FREEWORLD
                                        │
                                  ┌─────┴─────┐
                                  │ GAME STATE│
                                  └─────┬─────┘
                                        │
                                    EVENT BUS
                                        │
      ┌─────────────────┬───────────────┼───────────────┬─────────────────┐
      ↓                 ↓               ↓               ↓                 ↓
WORLD SYSTEMS     ENTITY SYSTEMS  STORY SYSTEMS   PLAYER SYSTEMS    PRESENTATION SYSTEMS
      │                 │               │               │                 │
 City/Grid         NPC/Vehicle     Story/Cinematic Controller/State    UI/HUD Overlay
 Roads/Metro       Human/Zombie    Dialogue/Quest  Inventory/Loot     Camera & Audio
      │                 │               │               │                 │
      └─────────────────┴───────────────┼───────────────┴─────────────────┘
                                        ↓
                              CROSS-CUTTING SYSTEMS
                                        │
        ┌───────────────────────┬───────┴───────┬───────────────────────┐
        │                       │               │                       │
    Streaming                  LOD         Persistence                Debug &
    & Sectors                Hierarchy       Schema                 Performance
```

### Master Engineering Pipeline Loop
```text
IMPLEMENT → INTEGRATE → TEST → PROFILE → REGRESSION TEST → DOCUMENT → EVIDENCE → PHASE GATE (FAIL → FIX | PASS → NEXT PHASE)
```

### System Realism Pillars
1. **Meaning of Realism**: Realism is evaluated across simulation behavior, animation, visuals, audio, environmental response, and persistence; visual realism alone is insufficient.
2. **Backward Compatibility Rule**: Every phase must preserve all previously working functionality. No phase may delete, replace, bypass, or silently invalidate an existing subsystem unless an explicit migration step has been documented and verified.
3. **No Placeholder System Rule**: No placeholder system may be represented as a completed system. If a feature is temporarily mocked, simulated, procedurally approximated, or unavailable because of browser/engine limitations, it must be explicitly marked as `MOCK`, `PROXY`, or `DEFERRED` and must not be reported as production-complete.
4. **Early Persistent-State Schema**: All new and modified subsystems must design serializable state schemas from their inception to guarantee seamless persistence in Phase 23.
5. **Decoupled Event Contracts**: All subsystems communicate via typed `EventBus` payloads without direct coupling.
6. **Multi-Tier Simulation Hierarchy**:
   - **NEAR (<75m)**: Full 3D, physics, IK animation, shadows, spatial audio, raycasts.
   - **MID (75–180m)**: Kinematic physics, instanced geometry, simplified AI.
   - **FAR (180–320m)**: Macro statistical simulation, vector movement, scheduled updates.
   - **UNLOADED (>320m)**: Serialized state, persistent timetables, background state ticks.

---

## 🛑 Standard Phase Completion Gate

A phase is **NOT** complete until every checkbox in this gate is verified:

- [ ] **Objective implemented**: Core phase features constructed and linked to engine.
- [ ] **Existing functionality verified**: Baseline player movement, driving, and camera intact.
- [ ] **New functionality manually tested**: Feature tested directly in live browser instance.
- [ ] **Event contracts validated**: All emitted events match `event_contracts.md` payloads.
- [ ] **Persistence schema validated**: State JSON serializes cleanly for future reload.
- [ ] **Integration with dependent systems verified**: Interacts properly with core loop.
- [ ] **0 console errors**: Zero JavaScript runtime errors or unhandled warnings.
- [ ] **No uncaught runtime exceptions**: Game loop never crashes or locks up.
- [ ] **60 FPS target maintained in normal scenes**: Standard scene runs at ~16.7ms frame time.
- [ ] **$\ge$45 FPS maintained during stress testing**: Dense scenes maintain performance floor.
- [ ] **No broken controls**: Keyboard, mouse, and interaction keys (`E`/`F`) functional.
- [ ] **No visual/physics/AI regression**: Collisions, raycasts, and rendering preserved.
- [ ] **Save/load compatibility verified where applicable**: State persists across ticks.
- [ ] **Debug instrumentation added where required**: Telemetry overlay hooks created.
- [ ] **Implementation documented**: Architectural documentation updated.
- [ ] **Evidence captured**: Browser screenshot, video, or console log saved.
- [ ] **Regression test passed**: Phase test protocol passes cleanly.
- [ ] **ONLY THEN proceed to next phase.**

---

## 📋 Full 25 Implementation Phase Specifications

---

### PHASE 0 — Audit & Foundation Lock (COMPLETED)
- **Objective**: Complete repository inventory, document baseline performance, create event registry and dependency map.
- **Dependencies**: None.
- **Existing Systems Affected**: Entire repository.
- **New Files**: `foundation_lock.md`, `system_dependency_map.md`, `event_contracts.md`, `migration_plan.md`, `baseline_report.md`.
- **Modified Files**: None.
- **Data Contracts & Serialization Schema**: Baseline event schemas.
- **Runtime Behavior**: Runtime telemetry inspection at `http://localhost:8085/`.
- **Integration Points**: All modules.
- **Performance Budget**: 60 FPS (~16.2ms frame time).
- **Acceptance Criteria**: Baseline audit documents created; 0 console errors.
- **Regression Tests**: Verify clean browser boot.
- **Deliverables**: Phase 0 Audit bundle.
- **STOP Condition**: COMPLETED.

---

### PHASE 1 — Event Foundation & Payload Validation
- **Objective**: Harden `EventBus.js` with dynamic schema validation, event history telemetry, and contract safety without breaking existing signals.
- **Dependencies**:
  - *Depends on*: Phase 0.
  - *Blocks*: Phase 2.
- **Existing Systems Affected**: `src/Core/EventBus.js`.
- **New Files**: `src/Core/EventValidator.js`.
- **Modified Files**: `src/Core/EventBus.js`.
- **Data Contracts & Serialization Schema**: Schema validation for `CRIME_COMMITTED`, `VEHICLE_HIT`, `WANTED_LEVEL_CHANGED`, `PLAYER_ENTERED_VEHICLE`.
- **Runtime Behavior**: Intercepts emissions, logs schema warnings on invalid payloads, executes listeners cleanly.
- **Integration Points**: Core simulation game loop.
- **Performance Budget**: Event dispatch execution $<0.05\text{ms}$ per frame.
- **Acceptance Criteria**:
  - *Functional*: 100% of event emissions validated against schemas.
  - *Integration*: Existing events emit and process normally.
  - *Performance*: 60 FPS normal target maintained.
  - *Regression*: No existing gameplay signals broken.
  - *Stability*: 0 JavaScript console errors.
  - *Documentation*: `event_contracts.md` updated with validation rules.
- **Regression Tests**: Trigger carjacking, shooting, wanted level changes and verify clean event delivery.
- **Deliverables**: Hardened `EventBus.js` with validator module.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 1 tests pass.

---

### PHASE 2 — Simulation Core & Early Persistence Schema
- **Objective**: Harden `GameState.js` and `EntityManager.js` while establishing early persistent-state serialization schemas.
- **Dependencies**:
  - *Depends on*: Phase 1.
  - *Blocks*: Phase 3, Phase 8, Phase 12.
- **Existing Systems Affected**: `src/Core/GameState.js`, `src/Core/EntityManager.js`.
- **New Files**: `src/Core/StateSchema.js`.
- **Modified Files**: `src/Core/GameState.js`, `src/Core/EntityManager.js`.
- **Data Contracts & Serialization Schema**: Define serializable state JSON structure for player vitals, cash, district, entity UUIDs, and timestamps.
- **Runtime Behavior**: Manages entity indexing, exposes `getEntitiesInRadius()`, serializes current state on demand.
- **Integration Points**: World simulation tick and entity registration.
- **Performance Budget**: Radius spatial queries $<0.2\text{ms}$ for 200 entities.
- **Acceptance Criteria**:
  - *Functional*: Unified spatial entity queries return accurate type-filtered results.
  - *Integration*: `GameState.get().toJSON()` returns valid serializable state schema.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Existing player stats and vehicle entry state preserved.
  - *Stability*: 0 console errors.
  - *Documentation*: State schema documented in `StateSchema.js`.
- **Regression Tests**: Query entities in radius 15m; serialize state and verify JSON structure.
- **Deliverables**: Enhanced `GameState.js` and `StateSchema.js`.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 2 tests pass.

---

### PHASE 3 — World Streaming & Multi-Tier LOD Hierarchy
- **Objective**: Upgrade `SectorManager.js` and `LODManager.js` to partition the world into 60m x 60m sectors with NEAR/MID/FAR/UNLOADED simulation tiers.
- **Dependencies**:
  - *Depends on*: Phase 2.
  - *Blocks*: Phase 4, Phase 5, Phase 8.
- **Existing Systems Affected**: `src/World/SectorManager.js`, `src/World/LODManager.js`, `src/World/Sectors.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/World/SectorManager.js`, `src/World/LODManager.js`.
- **Data Contracts & Serialization Schema**: Sector coordinate mapping `{ sectorX, sectorZ, lodTier }`.
- **Runtime Behavior**: Dynamically classifies active entities based on distance to player (`NEAR` <75m, `MID` 75-180m, `FAR` 180-320m, `UNLOADED` >320m).
- **Integration Points**: Camera position tracking and render graph culling.
- **Performance Budget**: Sector evaluation $<0.3\text{ms}$ per frame.
- **Acceptance Criteria**:
  - *Functional*: Entities transition between NEAR, MID, FAR tiers seamlessly.
  - *Integration*: Render graph culls entities >320m without breaking state.
  - *Performance*: 60 FPS maintained.
  - *Regression*: City block rendering and collision bounds intact.
  - *Stability*: 0 memory leaks during transits.
  - *Documentation*: Sector LOD boundaries recorded.
- **Regression Tests**: Drive across city map boundaries and verify sector transition events.
- **Deliverables**: Multi-tier streaming sector manager.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 3 tests pass.

---

### PHASE 4 — Real-World GIS Data Pipeline
- **Objective**: Implement a local GIS geographic data importer converting GeoJSON/OSM footprint datasets into normalized city graphs.
- **Dependencies**:
  - *Depends on*: Phase 3.
  - *Blocks*: Phase 5, Phase 6.
- **Existing Systems Affected**: `src/World/CityBuilder.js`.
- **New Files**: `src/World/GISDataParser.js`, `src/World/CityImporter.js`.
- **Modified Files**: `src/World/CityBuilder.js`.
- **Data Contracts & Serialization Schema**: City graph JSON `{ nodes, edges, footprints, POIs, districts }`.
- **Runtime Behavior**: Parses local geographic files to construct road graphs and building polygons, falling back gracefully to procedural generation if unavailable.
- **Integration Points**: City initialization pipeline.
- **Performance Budget**: One-time initial load $<400\text{ms}$, 0 per-frame HTTP requests.
- **Acceptance Criteria**:
  - *Functional*: Successfully normalizes local GeoJSON road/building data.
  - *Integration*: Fallback procedural synthesis activates when GIS data absent.
  - *Performance*: 60 FPS baseline maintained post-load.
  - *Regression*: Existing city layout navigation nodes remain valid.
  - *Stability*: 0 console errors.
  - *Documentation*: Data format guide created in `GISDataParser.js`.
- **Regression Tests**: Load city with GIS dataset; load city without GIS dataset (procedural fallback).
- **Deliverables**: `GISDataParser.js` and `CityImporter.js`.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 4 tests pass.

---

### PHASE 5 — Procedural 3D City Reconstruction & Landmarks
- **Objective**: Construct 3D city geometry from GIS graphs using instanced building facades and high-detail POI landmark meshes.
- **Dependencies**:
  - *Depends on*: Phase 4.
  - *Blocks*: Phase 6, Phase 12, Phase 13.
- **Existing Systems Affected**: `src/World/CityBuilder.js`, `src/World/PropSystem.js`.
- **New Files**: `src/World/LandmarkManager.js`.
- **Modified Files**: `src/World/CityBuilder.js`.
- **Data Contracts & Serialization Schema**: Building collider registry and landmark POI coordinates.
- **Runtime Behavior**: Generates 3D city blocks using 5 architectural styles and registers colliders in `CollisionSystem`.
- **Integration Points**: `CollisionSystem` static collider registration.
- **Performance Budget**: Total draw calls $<150$, geometry memory $<120\text{MB}$.
- **Acceptance Criteria**:
  - *Functional*: City renders 5 architectural block styles with landmark POIs.
  - *Integration*: All building bounds registered into spatial collision grid.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Player/Vehicle collision against building walls unchanged.
  - *Stability*: 0 WebGL shader compilation warnings.
  - *Documentation*: Architectural styles documented.
- **Regression Tests**: Drive vehicle into skyscraper facades in all 5 districts.
- **Deliverables**: Procedural 3D city generator with instancing.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 5 tests pass.

---

### PHASE 6 — Road Network & Traffic Flow Simulation
- **Objective**: Upgrade `NavigationGraph.js` and `TrafficManager.js` to support multi-lane traffic flow, intersection signal timing, and emergency merging.
- **Dependencies**:
  - *Depends on*: Phase 5.
  - *Blocks*: Phase 7, Phase 13, Phase 20.
- **Existing Systems Affected**: `src/World/NavigationGraph.js`, `src/Traffic/TrafficManager.js`, `src/Traffic/TrafficCar.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/World/NavigationGraph.js`, `src/Traffic/TrafficManager.js`, `src/Traffic/TrafficCar.js`.
- **Data Contracts & Serialization Schema**: Lane waypoint graph nodes `{ id, lane, direction, connections, isIntersection }`.
- **Runtime Behavior**: AI traffic follows multi-lane rules, respects signal lights, and yields to emergency sirens.
- **Integration Points**: Emergency Services sirens and Police pursuit AI.
- **Performance Budget**: 30 active traffic cars AI update $<1.2\text{ms}$ total per frame.
- **Acceptance Criteria**:
  - *Functional*: Traffic cars navigate multi-lane intersections without collisions or circular spinning.
  - *Integration*: Emergency sirens cause traffic cars to pull over / merge lanes.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Player carjacking of traffic cars remains functional.
  - *Stability*: 0 console errors.
  - *Documentation*: Traffic signal state machine documented.
- **Regression Tests**: Observe 4-way intersection traffic for 60 seconds; trigger emergency siren and verify lane merging.
- **Deliverables**: Multi-lane navigation graph and traffic flow engine.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 6 tests pass.

---

### PHASE 7 — Vehicle Physics & Multi-Zone Damage Deformation
- **Objective**: Refine `VehiclePhysics.js` and `VehicleDamage.js` for dynamic weight transfer, Pacejka slip curves, fuel leaks, and thermodynamic fire.
- **Dependencies**:
  - *Depends on*: Phase 6.
  - *Blocks*: Phase 18, Phase 21.
- **Existing Systems Affected**: `src/Vehicles/VehiclePhysics.js`, `src/Vehicles/VehicleDamage.js`, `src/Vehicles/VehicleBase.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/Vehicles/VehiclePhysics.js`, `src/Vehicles/VehicleDamage.js`.
- **Data Contracts & Serialization Schema**: Vehicle damage state `{ health, zoneHealth, isLeakingFuel, temperature, state }`.
- **Runtime Behavior**: Simulates chassis pitch/roll, tire slip, fuel leaks on rear hits (15% ignition check), smoldering fire (150°C-450°C), and cook-off explosions (>850°C).
- **Integration Points**: Fire Department water hose extinguish events and projectile hit zones.
- **Performance Budget**: Vehicle physics step $<0.4\text{ms}$ per active vehicle.
- **Acceptance Criteria**:
  - *Functional*: 6 vehicle classes exhibit distinct weight transfer and handling.
  - *Integration*: Fuel tank impacts produce fuel leak trails and gradual ignition.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Vehicle entry/exit, handbrake drift, and audio telemetry intact.
  - *Stability*: 0 NaN velocity or physics engine explosions.
  - *Documentation*: Vehicle handling parameters documented.
- **Regression Tests**: Shoot vehicle fuel tank; verify leak $\rightarrow$ fire $\rightarrow$ explosion progression.
- **Deliverables**: Enhanced vehicle dynamics and thermodynamic damage model.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 7 tests pass.

---

### PHASE 8 — Human Character Model Foundation, Player Systems & Skeletons
- **Objective**: Construct realistic human anatomical skeletons, clothing mesh layers, skin/hair materials, character rigs, and extend Player/Inventory Systems.
- **Dependencies**:
  - *Depends on*: Phase 2, Phase 3.
  - *Blocks*: Phase 9, Phase 10, Phase 14.
- **Existing Systems Affected**: `src/NPC/NPCModel.js`, `src/Player/PlayerModel.js`, `src/Player/PlayerController.js`.
- **New Files**: `src/NPC/CharacterRig.js`, `src/Player/PlayerInventory.js`, `src/Player/ItemRegistry.js`.
- **Modified Files**: `src/NPC/NPCModel.js`, `src/Player/PlayerModel.js`, `src/Player/PlayerController.js`.
- **Data Contracts & Serialization Schema**: Character appearance & Inventory JSON `{ gender, height, clothingType, skinTone, hairStyle, inventory: [{ itemId, count, slot }] }`.
- **Runtime Behavior**: Assembles 3D character mesh with bone hierarchy, manages player equipment, consumables, and inventory slots.
- **Integration Points**: InteractionManager and render graph shadow maps.
- **Performance Budget**: Character rig update $<0.05\text{ms}$ per character.
- **Acceptance Criteria**:
  - *Functional*: 3D human character meshes render with proper proportions; Player Inventory manages items.
  - *Integration*: Supports Civilian, Police, Paramedic, and Survivor visual variations.
  - *Performance*: 60 FPS maintained with 25 visible characters.
  - *Regression*: Player on-foot locomotion visual model functional.
  - *Stability*: 0 mesh distortion or unweighted vertex artifacts.
  - *Documentation*: Bone naming convention and Item schema documented.
- **Regression Tests**: Pick up items into Player Inventory; spawn 25 characters; inspect mesh integrity.
- **Deliverables**: `CharacterRig.js`, `PlayerInventory.js`, and `ItemRegistry.js`.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 8 tests pass.

---

### PHASE 9 — Human Animation Architecture, IK & Interaction Manager
- **Objective**: Build animation blend trees (`NPCAnimation.js`), inverse kinematics (`NPCIK.js`), and context Interaction System for doors, loot, and vehicles.
- **Dependencies**:
  - *Depends on*: Phase 8.
  - *Blocks*: Phase 10, Phase 15.
- **Existing Systems Affected**: `src/NPC/NPCModel.js`, `src/Player/PlayerController.js`, `src/Player/InteractionSystem.js`.
- **New Files**: `src/NPC/NPCAnimation.js`, `src/NPC/NPCIK.js`, `src/Player/InteractionManager.js`.
- **Modified Files**: `src/NPC/NPCModel.js`, `src/Player/PlayerController.js`, `src/Player/InteractionSystem.js`.
- **Data Contracts & Serialization Schema**: Locomotion state & Interaction prompt payload `{ speed, turnRate, locomotionState, ikTargets, promptText, targetEntity }`.
- **Runtime Behavior**: Blends locomotion animations (Idle, Walk, Jog, Sprint, Cover), aligns feet via IK, and triggers context interaction prompts (`E`/`F`).
- **Integration Points**: Terrain collision raycasts and HUD prompt overlay.
- **Performance Budget**: IK solver $<0.08\text{ms}$ per active NEAR character.
- **Acceptance Criteria**:
  - *Functional*: Character feet snap naturally to sloped roads and stairs; interaction prompt activates cleanly near doors, loot, and vehicles.
  - *Integration*: Locomotion blends smoothly based on movement velocity.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Player walking/running and basic vehicle entry prompts responsive.
  - *Stability*: 0 bone quaternion inversion errors.
  - *Documentation*: Animation state machine and Interaction triggers documented.
- **Regression Tests**: Walk character up stairs; approach vehicle/door; verify prompt and IK alignment.
- **Deliverables**: Locomotion blend tree engine, IK solver, and `InteractionManager.js`.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 9 tests pass.

---

### PHASE 10 — Human NPC Brain & Personality System
- **Objective**: Implement `NPCBrain.js` with personality traits (Coward, Aggressive, Curious, Samaritan, Exhausted) driving contextual decision pipelines.
- **Dependencies**:
  - *Depends on*: Phase 9.
  - *Blocks*: Phase 11, Phase 14.
- **Existing Systems Affected**: `src/NPC/NPCBrain.js`, `src/NPC/CivilianAI.js`, `src/NPC/NPCManager.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/NPC/NPCBrain.js`, `src/NPC/NPCManager.js`.
- **Data Contracts & Serialization Schema**: NPC brain state `{ personality, currentGoal, fearLevel, health, inventory }`.
- **Runtime Behavior**: Evaluates environmental stimuli and selects appropriate action behaviors (`WALKING`, `FLEEING`, `CALLING_POLICE`, `TAKING_COVER`, `HELPING`).
- **Integration Points**: Perception cone updates and event bus threat notifications.
- **Performance Budget**: 25 active NPC brains evaluation $<1.0\text{ms}$ total per frame.
- **Acceptance Criteria**:
  - *Functional*: Coward NPCs flee immediately; Samaritans attempt victim assistance; Aggressive NPCs confront threats.
  - *Integration*: Gunshot acoustic events trigger phone calls to 911 dispatch.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Pedestrian sidewalk navigation intact.
  - *Stability*: 0 infinite decision loops.
  - *Documentation*: Personality utility matrix documented.
- **Regression Tests**: Fire weapon near group of NPCs with varied personalities; verify distinct reactions.
- **Deliverables**: Personality-driven Utility AI decision engine.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 10 tests pass.

---

### PHASE 11 — NPC Memory & Dynamic Relationships
- **Objective**: Upgrade `NPCMemory.js` and build `NPCRelationships.js` for persistent suspect profiling, memory decay, and evolving social relationships.
- **Dependencies**:
  - *Depends on*: Phase 10.
  - *Blocks*: Phase 14, Phase 18.
- **Existing Systems Affected**: `src/NPC/NPCMemory.js`.
- **New Files**: `src/NPC/NPCRelationships.js`.
- **Modified Files**: `src/NPC/NPCMemory.js`.
- **Data Contracts & Serialization Schema**: Memory graph JSON `{ suspectProfile, relationshipScores, traumaScore, witnessedCrimes }`.
- **Runtime Behavior**: Records witnessed crimes/rescues, updates relationship status (`FRIEND`, `ALLY`, `STRANGER`, `ENEMY`, `RIVAL`), and checks suspect recognition.
- **Integration Points**: Player interaction system and SaveState serialization.
- **Performance Budget**: Memory graph query $<0.1\text{ms}$ per encounter.
- **Acceptance Criteria**:
  - *Functional*: NPCs recognize returning player after witnessing crimes or being rescued.
  - *Integration*: Relationship scores alter NPC dialogue choices and willingness to help.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Crime reporting mechanics functional.
  - *Stability*: 0 memory leaks in relationship maps.
  - *Documentation*: Relationship state transition rules recorded.
- **Regression Tests**: Rescue NPC from threat; leave sector; return and verify recognition dialogue.
- **Deliverables**: Systemic NPC memory graph and relationship matrix.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 11 tests pass.

---

### PHASE 12 — Infrastructure & Power Grid Simulation
- **Objective**: Build `PowerGridManager.js` simulating power plants, substations, district grids, and cascading blackout failures.
- **Dependencies**:
  - *Depends on*: Phase 2, Phase 5.
  - *Blocks*: Phase 13, Phase 17.
- **Existing Systems Affected**: `src/World/PropSystem.js`, `src/Weather/TimeManager.js`.
- **New Files**: `src/Infrastructure/PowerGridManager.js`.
- **Modified Files**: `src/World/PropSystem.js`.
- **Data Contracts & Serialization Schema**: Power grid state `{ districtId, isPowered, loadPct, backupGeneratorActive }`.
- **Runtime Behavior**: Manages electrical distribution across districts; substation failure shuts down streetlamps, traffic signals, and triggers emergency hospital generators.
- **Integration Points**: TimeManager night lighting and traffic signal state controller.
- **Performance Budget**: Power grid tick $<0.1\text{ms}$ per second.
- **Acceptance Criteria**:
  - *Functional*: District blackout turns off streetlamps and traffic signals.
  - *Integration*: Hospitals activate glowing backup emergency generators during blackouts.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Normal day/night streetlamp light switching operational.
  - *Stability*: 0 unhandled power grid state exceptions.
  - *Documentation*: Power grid topology documented.
- **Regression Tests**: Trigger blackout in Downtown district; verify streetlamp shutdown and hospital backup light activation.
- **Deliverables**: District power grid simulation manager.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 12 tests pass.

---

### PHASE 13 — Functional Public Transport (Metro System)
- **Objective**: Implement `MetroManager.js` supporting multi-tier metro simulation (trains, tracks, stations, schedules, passenger boarding, power shutdowns).
- **Dependencies**:
  - *Depends on*: Phase 6, Phase 12.
  - *Blocks*: Phase 17, Phase 23.
- **Existing Systems Affected**: `src/World/CityBuilder.js`, `src/NPC/NPCBrain.js`.
- **New Files**: `src/Infrastructure/MetroManager.js`, `src/Infrastructure/MetroTrain.js`, `src/Infrastructure/MetroStation.js`.
- **Modified Files**: `src/World/CityBuilder.js`.
- **Data Contracts & Serialization Schema**: Metro state `{ lineId, trains: [{ trainId, currentStation, speed, status }], stations }`.
- **Runtime Behavior**: Operates metro trains on fixed schedules; NEAR tier renders 3D train/passengers; power blackout halts trains between stations causing passenger panic.
- **Integration Points**: PowerGridManager power state and NPC routine commuting schedules.
- **Performance Budget**: Metro manager update $<0.3\text{ms}$ per frame.
- **Acceptance Criteria**:
  - *Functional*: Metro trains stop at stations, open doors, allow NPC boarding, and depart.
  - *Integration*: District blackout stops metro trains mid-tunnel and triggers passenger panic.
  - *Performance*: 60 FPS target maintained.
  - *Regression*: Ground traffic and pedestrian navigation unaffected.
  - *Stability*: 0 train dereferencing errors.
  - *Documentation*: Metro line timetable documented.
- **Regression Tests**: Ride metro train from Station A to Station B; cut power mid-transit and observe emergency shutdown.
- **Deliverables**: Multi-tier functional Metro simulation engine.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 13 tests pass.

---

### PHASE 14 — Zombie Biological Foundation & Infection System
- **Objective**: Build `InfectionSystem.js` and `ZombieModel.js` supporting pathogen exposure timers, multi-stage infection, and NPC-to-Zombie reanimation.
- **Dependencies**:
  - *Depends on*: Phase 8, Phase 10, Phase 11.
  - *Blocks*: Phase 15, Phase 16.
- **Existing Systems Affected**: `src/NPC/NPCBase.js`, `src/NPC/NPCManager.js`.
- **New Files**: `src/Zombies/InfectionSystem.js`, `src/Zombies/ZombieModel.js`.
- **Modified Files**: `src/NPC/NPCBase.js`, `src/NPC/NPCManager.js`.
- **Data Contracts & Serialization Schema**: Infection state `{ entityId, originalNPCData: { name, clothing, occupation }, infectionStage, stageTimer }`.
- **Runtime Behavior**: Tracks bite exposure; progresses from Stage 0 Exposed $\rightarrow$ Stage 1 Fever $\rightarrow$ Stage 2 Collapse $\rightarrow$ Stage 3 Reanimated Zombie while preserving former NPC identity.
- **Integration Points**: NPC health system and SaveState serialization.
- **Performance Budget**: Infection tick $<0.15\text{ms}$ for 100 entities.
- **Acceptance Criteria**:
  - *Functional*: Infected living NPCs collapse and reanimate as active zombies.
  - *Integration*: Reanimated zombie retains original NPC clothing, name, and identity parameters.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Living NPC health and damage mechanics intact.
  - *Stability*: 0 entity ID duplication errors.
  - *Documentation*: Infection stage progression table created.
- **Regression Tests**: Expose civilian NPC to bite; observe collapse and reanimation with original identity tags intact.
- **Deliverables**: Pathogen infection engine and entity transformation manager.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 14 tests pass.

---

### PHASE 15 — Zombie AI, Hybrid Physics & Perception
- **Objective**: Implement `ZombieController.js` and `ZombiePerception.js` with visual/acoustic sensing, stagger locomotion, and physical obstacle interaction.
- **Dependencies**:
  - *Depends on*: Phase 9, Phase 14.
  - *Blocks*: Phase 16.
- **Existing Systems Affected**: `src/Core/EntityManager.js`.
- **New Files**: `src/Zombies/ZombieController.js`, `src/Zombies/ZombiePerception.js`.
- **Modified Files**: `src/Core/EntityManager.js`.
- **Data Contracts & Serialization Schema**: Zombie AI state `{ state: 'WANDERING'|'INVESTIGATING'|'CHASING'|'LUNGING'|'CRAWLING', targetPos, noiseInterest }`.
- **Runtime Behavior**: Evaluates gunshots, engine noise, and visual line-of-sight; executes stagger/lunge locomotion and crawling when legs are severed.
- **Integration Points**: SoundEngine acoustic events and CollisionSystem.
- **Performance Budget**: Zombie AI update $<0.03\text{ms}$ per active zombie.
- **Acceptance Criteria**:
  - *Functional*: Zombies navigate toward noise sources (gunshots, vehicle revs) and attack visible humans.
  - *Integration*: Physical collisions prevent zombies from clipping through building walls or vehicles.
  - *Performance*: 60 FPS maintained with 30 active zombies.
  - *Regression*: Player weapon hitscan collision against zombies functional.
  - *Stability*: 0 infinite target acquisition loops.
  - *Documentation*: Sensory perception radii documented.
- **Regression Tests**: Fire gun behind wall; verify nearby zombies investigate sound origin.
- **Deliverables**: Zombie sensory perception engine and AI controller.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 15 tests pass.

---

### PHASE 16 — Zombie Horde System & Flocking Dynamics
- **Objective**: Build `HordeSystem.js` supporting macro group flocking algorithms, spatial density clustering, sound attraction, and horde migration vectors.
- **Dependencies**:
  - *Depends on*: Phase 15.
  - *Blocks*: Phase 17.
- **Existing Systems Affected**: `src/Zombies/ZombieController.js`.
- **New Files**: `src/Zombies/HordeSystem.js`, `src/Zombies/HordeFlocking.js`.
- **Modified Files**: `src/Zombies/ZombieController.js`.
- **Data Contracts & Serialization Schema**: Horde group state `{ hordeId, centerPos, velocity, memberIds: [], targetVector }`.
- **Runtime Behavior**: Clusters individual zombies into cohesive hordes that flock together, split around obstacles, and migrate toward major acoustic events.
- **Integration Points**: Spatial grid partition and sector simulation tiers.
- **Performance Budget**: 100-zombie flocking calculation $<1.5\text{ms}$ per frame; FPS floor $\ge$45 during stress test.
- **Acceptance Criteria**:
  - *Functional*: 100 simulated zombies move as a cohesive horde without entity overlaps or infinite AI loops.
  - *Integration*: Major explosions pull distant hordes across sector boundaries.
  - *Performance*: Target FPS $\ge$45 during 100-zombie stress scenario.
  - *Regression*: Existing vehicle physics and NPC panic behaviors unaffected.
  - *Stability*: 0 memory leaks in flocking member arrays.
  - *Documentation*: Flocking weighting coefficients documented.
- **Regression Tests**: Spawn 100 zombies in City Plaza; trigger explosion; verify cohesive horde movement toward blast origin.
- **Deliverables**: `HordeSystem.js` macro group flocking manager.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 16 tests pass.

---

### PHASE 17 — Dynamic Outbreak World Director & Presentation Overlay
- **Objective**: Build `OutbreakManager.js` controlling the 10 outbreak stages (Stage 0 Normal $\rightarrow$ Stage 9 City-Wide Collapse) and update presentation overlay (`HUDManager.js`).
- **Dependencies**:
  - *Depends on*: Phase 12, Phase 13, Phase 16.
  - *Blocks*: Phase 18, Phase 20.
- **Existing Systems Affected**: `src/Core/WorldSimulation.js`, `src/Traffic/TrafficManager.js`, `src/Police/PoliceManager.js`, `src/UI/HUDManager.js`.
- **New Files**: `src/Zombies/OutbreakManager.js`.
- **Modified Files**: `src/Core/WorldSimulation.js`, `src/UI/HUDManager.js`.
- **Data Contracts & Serialization Schema**: Outbreak state `{ stage: 0..9, stageName, globalInfectionRate, districtStages: {} }`.
- **Runtime Behavior**: Dynamically escalates city condition: Stage 0 (Normal) $\rightarrow$ Stage 3 (Localized Outbreak) $\rightarrow$ Stage 6 (District Lockdown) $\rightarrow$ Stage 9 (Collapse), altering traffic density, police response, radio broadcasts, HUD outbreak status banner, and store availability.
- **Integration Points**: Presentation layer HUD status bar and all world subsystems via events.
- **Performance Budget**: Outbreak state director tick $<0.05\text{ms}$.
- **Acceptance Criteria**:
  - *Functional*: Outbreak stages dynamically alter global city behavior (traffic chaos, emergency broadcasts, barricades).
  - *Integration*: Power grid blackouts and metro disruptions accelerate local district outbreak stage; HUD displays outbreak status badge.
  - *Performance*: 60 FPS target maintained.
  - *Regression*: Standard city gameplay functional during Stage 0.
  - *Stability*: 0 unhandled stage transition states.
  - *Documentation*: Outbreak stages 0-9 matrix documented.
- **Regression Tests**: Advance outbreak stage from Stage 0 to Stage 6; verify emergency alerts, barricades, panic behaviors, and HUD outbreak badge.
- **Deliverables**: `OutbreakManager.js` world state director.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 17 tests pass.

---

### PHASE 18 — Story Engine, Mission Manager & Branching Dialogue
- **Objective**: Build `StoryManager.js`, `MissionManager.js`, `ChapterManager.js`, and `DialogueSystem.js` for narrative chapter progression, dynamic subtitles, quest triggers, and branching dialogue choices.
- **Dependencies**:
  - *Depends on*: Phase 11, Phase 17.
  - *Blocks*: Phase 19, Phase 23.
- **Existing Systems Affected**: `src/UI/HUDManager.js`.
- **New Files**: `src/Story/StoryManager.js`, `src/Story/MissionManager.js`, `src/Story/ChapterManager.js`, `src/Story/DialogueSystem.js`.
- **Modified Files**: `src/UI/HUDManager.js`.
- **Data Contracts & Serialization Schema**: Story state `{ currentChapter, completedChapters: [], storyFlags: {}, questObjectives: [] }`.
- **Runtime Behavior**: Drives Act progression (Prologue through Act VII), triggers dynamic dialogue overlays, manages active quest objectives (`Story -> MissionManager -> Objectives -> Triggers -> Rewards -> World Consequences`), and tracks narrative decisions.
- **Integration Points**: Presentation layer objective banner, NPC relationship matrix, and interaction prompts.
- **Performance Budget**: Story tick $<0.05\text{ms}$.
- **Acceptance Criteria**:
  - *Functional*: Narrative progression executes chapters with active subtitles, mission objective banners, and branching options.
  - *Integration*: Dialogue choices react to past NPC relationship scores; quest completion updates world state.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Existing interaction prompts and objective banners functional.
  - *Stability*: 0 narrative state lockups.
  - *Documentation*: Chapter structure and quest tree documented.
- **Regression Tests**: Trigger Prologue dialogue; choose branching response; verify mission objective and story flag updates.
- **Deliverables**: `MissionManager.js`, story chapter manager, and branching dialogue tree.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 18 tests pass.

---

### PHASE 19 — Live Simulation Cinematic Director
- **Objective**: Implement `CinematicDirector.js` to execute in-world live cutscenes with dynamic camera framing without pausing active world simulation ticks.
- **Dependencies**:
  - *Depends on*: Phase 18.
  - *Blocks*: Phase 25.
- **Existing Systems Affected**: `src/Player/CameraController.js`.
- **New Files**: `src/Story/CinematicDirector.js`.
- **Modified Files**: `src/Player/CameraController.js`.
- **Data Contracts & Serialization Schema**: Cinematic sequence descriptor `{ sequenceId, cameraWaypoints, targetEntities, duration }`.
- **Runtime Behavior**: Transitions camera smoothly to track story events, dialogue, and explosions while traffic, NPCs, and zombies continue simulating in the background.
- **Integration Points**: CameraController mode switcher.
- **Performance Budget**: Cinematic camera update $<0.1\text{ms}$ per frame.
- **Acceptance Criteria**:
  - *Functional*: Cinematics execute live in 3D world space while background simulation continues.
  - *Integration*: Player control seamlessly returns immediately upon cinematic completion.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Standard third-person camera controls restored cleanly.
  - *Stability*: 0 camera target null pointer errors.
  - *Documentation*: Cinematic camera composition rules documented.
- **Regression Tests**: Trigger live cinematic event while driving; observe smooth camera tracking and seamless return of control.
- **Deliverables**: `CinematicDirector.js` live scene director.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 19 tests pass.

---

### PHASE 20 — Police & Emergency Multi-Faction Response
- **Objective**: Upgrade `PoliceManager.js` and `EmergencyServices.js` to support multi-faction dispatch (Police, SWAT, Military, Paramedics, Fire Department) with tactical roadblocks.
- **Dependencies**:
  - *Depends on*: Phase 6, Phase 17.
  - *Blocks*: Phase 25.
- **Existing Systems Affected**: `src/Police/PoliceManager.js`, `src/Police/PoliceAI.js`, `src/WorldSystems/EmergencyServices.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/Police/PoliceManager.js`, `src/Police/PoliceAI.js`, `src/WorldSystems/EmergencyServices.js`.
- **Data Contracts & Serialization Schema**: Multi-faction dispatch payload `{ faction: 'POLICE'|'SWAT'|'MILITARY'|'PARAMEDIC'|'FIRE', position, unitCount }`.
- **Runtime Behavior**: Dispatches appropriate law enforcement or emergency units based on wanted level and outbreak stage; deploys SWAT armored vehicles and military roadblocks at high threat levels.
- **Integration Points**: NavigationGraph roadblock nodes and WantedSystem heat.
- **Performance Budget**: Multi-faction dispatch tick $<0.4\text{ms}$.
- **Acceptance Criteria**:
  - *Functional*: 5-star wanted levels and late outbreak stages spawn SWAT cruisers and military roadblocks.
  - *Integration*: Emergency units navigate around horde blockades to reach incidents.
  - *Performance*: 60 FPS maintained.
  - *Regression*: 1-3 star wanted level pursuit and surrender mechanics unchanged.
  - *Stability*: 0 unit dispatch over-spawning errors.
  - *Documentation*: Multi-faction escalation table recorded.
- **Regression Tests**: Trigger 5-star wanted level in Stage 6 outbreak; verify SWAT roadblock deployment.
- **Deliverables**: Multi-faction dispatch engine and tactical roadblock controller.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 20 tests pass.

---

### PHASE 21 — Weapon Arsenal Feel, Ballistics & Multi-Zone Fire
- **Objective**: Refine `WeaponSystem.js` and `HitReaction.js` with penetration ballistics, recoil camera impulse, shell casing ejection, and multi-zone NPC hit reactions.
- **Dependencies**:
  - *Depends on*: Phase 7.
  - *Blocks*: Phase 23.
- **Existing Systems Affected**: `src/Combat/WeaponSystem.js`, `src/Combat/HitReaction.js`.
- **New Files**: `src/Combat/ProjectileManager.js`.
- **Modified Files**: `src/Combat/WeaponSystem.js`, `src/Combat/HitReaction.js`.
- **Data Contracts & Serialization Schema**: Weapon telemetry `{ weaponId, currentClip, reserve, recoilImpulse, spreadBloom }`.
- **Runtime Behavior**: Simulates raycast/projectile ballistics, ejects shell casings, applies camera recoil punch, and triggers limb-specific reactions (headshot kill, arm drop, leg limp, shotgun blast knockback).
- **Integration Points**: NPC and Zombie hit reaction handlers.
- **Performance Budget**: Ballistic raycast step $<0.2\text{ms}$ per shot.
- **Acceptance Criteria**:
  - *Functional*: Distinct hit reactions occur for head, torso, arm, and leg impacts on NPCs and zombies.
  - *Integration*: Camera recoil impulse and shell casing particle ejection execute on firing.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Weapon switching, reloading, and ammo HUD display functional.
  - *Stability*: 0 raycast intersection exceptions.
  - *Documentation*: Ballistics damage table recorded.
- **Regression Tests**: Test firing all 4 weapons (Fists, Pistol, Carbine, Shotgun); verify casing ejection, camera recoil, and multi-zone hit reactions.
- **Deliverables**: Advanced ballistics engine and multi-zone hit reaction system.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 21 tests pass.

---

### PHASE 22 — Atmospheric Urban Weather, Multi-Layer Lighting & Web Audio
- **Objective**: Expand `TimeManager.js`, `WeatherManager.js`, and `SoundEngine.js` for spatial audio, dynamic storm rain sheen, fog density, lightning flashes, and procedural engine audio.
- **Dependencies**:
  - *Depends on*: Phase 12.
  - *Blocks*: Phase 25.
- **Existing Systems Affected**: `src/Weather/TimeManager.js`, `src/Weather/WeatherManager.js`, `src/Audio/SoundEngine.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/Weather/TimeManager.js`, `src/Weather/WeatherManager.js`, `src/Audio/SoundEngine.js`.
- **Data Contracts & Serialization Schema**: Weather & Audio state `{ weatherType, rainIntensity, fogDensity, audioPreset }`.
- **Runtime Behavior**: Adjusts sky/ambient lighting, rain ground reflections, delayed thunder audio, spatial Doppler sirens, and engine pitch synthesis based on vehicle RPM.
- **Integration Points**: VehiclePhysics road friction modifier and TimeManager solar orbital angle.
- **Performance Budget**: Audio & Weather update $<0.3\text{ms}$ per frame.
- **Acceptance Criteria**:
  - *Functional*: Rain storm reduces road friction, creates ground sheen, and triggers delayed thunder audio.
  - *Integration*: Web Audio engine synthesizes dynamic engine pitch matching RPM and gear shifts.
  - *Performance*: 60 FPS maintained.
  - *Regression*: Mute/unmute and basic siren sounds functional.
  - *Stability*: 0 Web Audio Context state crashes.
  - *Documentation*: Lighting curves and audio node graph documented.
- **Regression Tests**: Enable rain storm at Midnight; test vehicle handling sheen and listen to engine pitch during acceleration.
- **Deliverables**: Spatial Web Audio synthesizer and atmospheric lighting manager.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 22 tests pass.

---

### PHASE 23 — 100-Item Bucket List System & Deep World Persistence Engine
- **Objective**: Build `BucketListSystem.js` and expand `SaveManager.js` to track 100 bucket list activities and execute deep, non-destructive `localStorage` save/load state serialization.
- **Dependencies**:
  - *Depends on*: Phase 2, Phase 13, Phase 18, Phase 21.
  - *Blocks*: Phase 24, Phase 25.
- **Existing Systems Affected**: `src/SaveSystem/SaveManager.js`, `src/Core/GameState.js`.
- **New Files**: `src/Story/BucketListSystem.js`.
- **Modified Files**: `src/SaveSystem/SaveManager.js`, `src/Core/GameState.js`.
- **Data Contracts & Serialization Schema**: Master Save JSON `{ version: 5, player, inventory, cash, bank, vehicles, infectedNPCs, destroyedProps, powerGridState, metroState, outbreakStage, storyFlags, bucketListProgress: [] }`.
- **Runtime Behavior**: Tracks 100 activity completions; serializes complete world state to `localStorage`; restores exact player, world, district, metro, and NPC states on load.
- **Integration Points**: All major world, entity, story, player, and presentation subsystems.
- **Performance Budget**: Save JSON serialization $<15\text{ms}$ (non-blocking async), load restoration $<40\text{ms}$.
- **Acceptance Criteria**:
  - *Functional*: Player can view and complete 100 bucket list items; full save/load restores exact world state.
  - *Integration*: Reloading game preserves destroyed props, power blackout states, metro position, and infected NPC identities.
  - *Performance*: 60 FPS maintained during gameplay.
  - *Regression*: Existing basic save/load functionality preserved.
  - *Stability*: 0 JSON schema parse errors or corrupted state loads.
  - *Documentation*: Master save schema recorded in `SaveManager.js`.
- **Regression Tests**: Complete bucket list activity, destroy prop, cut power, save game; reload and verify 100% state restoration.
- **Deliverables**: `BucketListSystem.js` and master world persistence engine.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 23 tests pass.

---

### PHASE 24 — Developer Debug Suite (F1-F9 Overlays) & Performance Throttle Engine
- **Objective**: Expand `DebugConsole.js` and `PerformanceManager.js` with F1-F9 visual debugging overlays and dynamic frame-time budget throttling.
- **Dependencies**:
  - *Depends on*: Phase 23.
  - *Blocks*: Phase 25.
- **Existing Systems Affected**: `src/Tools/DebugConsole.js`, `src/Tools/WorldInspector.js`, `src/Core/PerformanceManager.js`.
- **New Files**: None (extending existing).
- **Modified Files**: `src/Tools/DebugConsole.js`, `src/Tools/WorldInspector.js`, `src/Core/PerformanceManager.js`.
- **Data Contracts & Serialization Schema**: Performance telemetry `{ fps, frameTimeMs, drawCalls, activeEntities, lodTierCounts, memoryUsage }`.
- **Runtime Behavior**: Provides F1-F9 visual debug overlays (Console, AI paths, Collision boxes, World simulation, NPC states, Zombie states, Story states, Infrastructure, Telemetry) and automatically throttles shadows/particles if frame time exceeds 22ms for 3 consecutive frames.
- **Integration Points**: Engine main loop rendering.
- **Performance Budget**: Debug overlay render overhead $<0.1\text{ms}$.
- **Acceptance Criteria**:
  - *Functional*: F1 through F9 shortcuts toggle clean developer debug overlays.
  - *Integration*: Dynamic performance throttle reliably maintains frame rate floor $\ge$45 FPS during stress scenes.
  - *Performance*: 60 FPS target maintained in normal scenes.
  - *Regression*: Debug console cheats and teleportation intact.
  - *Stability*: 0 DOM overlay memory leaks.
  - *Documentation*: Debug keybindings and cheat commands documented.
- **Regression Tests**: Toggle all F1-F9 debug overlays; induce heavy entity load and verify automatic performance throttling activation.
- **Deliverables**: F1-F9 developer debug suite and dynamic performance throttle engine.
- **STOP Condition**: Pause for Phase Completion Gate verification after Phase 24 tests pass.

---

### PHASE 25 — Master Vertical-Slice Integration & Polish
- **Objective**: Execute final master end-to-end integration test validating living city, zombie outbreak, functional infrastructure, story engine, bucket list, persistence, and cinematic experience.
- **Dependencies**:
  - *Depends on*: Phases 0 through 24.
  - *Blocks*: None (Final Phase).
- **Existing Systems Affected**: `main.js`, `src/Core/Engine.js`.
- **New Files**: None.
- **Modified Files**: `main.js`, `src/Core/Engine.js`.
- **Data Contracts & Serialization Schema**: Master application initialization contract.
- **Runtime Behavior**: Executes seamless open-world gameplay loop: Normal City Commute $\rightarrow$ Outbreak Escalation $\rightarrow$ Traffic/Metro Disruption $\rightarrow$ Power Grid Blackout $\rightarrow$ Zombie Horde Escape $\rightarrow$ Survivor Rescue $\rightarrow$ Safehouse $\rightarrow$ Bucket List Activity $\rightarrow$ Live Cinematic Story Event $\rightarrow$ Persistence Save & Reload Restoration.
- **Integration Points**: Entire FreeWorld application codebase.
- **Performance Budget**: **60 FPS target in normal scenes, $\ge$45 FPS in stress scenes**, $<16.7\text{ms}$ frame time.
- **Acceptance Criteria**:
  - *Functional*: Continuous vertical-slice gameplay run completes without a single failure or broken state.
  - *Integration*: All subsystems interact systemically according to architectural core principles.
  - *Performance*: 60 FPS normal target, $\ge$45 FPS stress floor maintained.
  - *Regression*: 100% backward compatibility maintained across all original systems.
  - *Stability*: **0 JavaScript console errors**.
  - *Documentation*: Final Master Walkthrough generated in `walkthrough.md`.
- **Regression Tests**: Execute full master vertical-slice playthrough from start to save/reload restoration.
- **Deliverables**: Fully transformed **FreeWorld — Ultimate Real-City Apocalypse** game engine.
- **STOP Condition**: Completion of master vertical-slice verification and Phase Completion Gate approval.
