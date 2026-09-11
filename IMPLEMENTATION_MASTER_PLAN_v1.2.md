# FREEWORLD — ULTIMATE REAL-CITY APOCALYPSE
## MASTER TRANSFORMATION & DEVELOPMENT SPECIFICATION v5.0
### IMPLEMENTATION MASTER PLAN v1.2

This master document establishes the authoritative, standardized technical blueprint for evolving the existing **FreeWorld** engine into a persistent, living-city survival experience incorporating the **6-Layer System Architecture** and **10 System Realism Pillars**.

---

## 🏛️ 6-Layer System Architecture

```text
                                    FREEWORLD
                                        │
                                  ┌─────┴─────┐
                                  │ GAME STATE│
                                  └─────┬─────┘
                                        │
                                    EVENT BUS
                                        │
┌─────────┬──────────┬──────┬──────┼─────────┬──────────┬────────────┐
│         │          │      │      │         │          │            │
WORLD   ENTITY     PLAYER STORY GAMEPLAY  PRESENTATION CROSS-CUTTING
│         │          │      │      │         │            │
City    Humans    Controls Chapters Missions UI/HUD      Streaming
Roads   Zombies   Inventory Dialogue Clues  Camera       LOD Hierarchy
Metro   Vehicles  Interact Flashback Emergent Audio      Persistence
Power   NPC Brain Equip  Decisions  Bucket  Cinematics   Debug/Perf
Weather Night/Bldg  Bikes  Characters  Chain  Screen FX
```

---

## 🎯 10 Master System Realism Pillars

1. **6-Layer System Architecture**: Clear decoupling between `WORLD`, `ENTITY`, `PLAYER`, `STORY`, `GAMEPLAY / EXPERIENCE`, `PRESENTATION`, and `CROSS-CUTTING` layers.
2. **Night + Building Realism**: Building State Engine (`Exterior`, `Interior`, `Rooms`, `Doors`, `Windows`, `Lights`, `Power State`, `Occupants`, `Loot`, `Security`, `Activity`, `Damage`). Dynamic reaction to Power ON/OFF (emergency lights, NPC panic, darkness, zombie migration to light/noise, NPCs navigating dark interiors with flashlights/phones).
3. **Zombies as Systemic Gameplay Threat**: Multi-sensor perception (sight, sound, movement, smell abstraction), physical state variations (stumbling, falling, crawling, climbing, grabbing, missing attacks, obstacle/vehicle reaction), and persistent world positioning (spawned by outbreak simulation, not arbitrary player triggers).
4. **Human Police Arrest Behavior**: Tactical physical officer exit (`Police vehicle -> Stops -> Officer exits -> Approaches -> Draw weapon & Commands -> "STOP!" -> Player Surrender / Run / Fight options -> Cuff / Pursuit / Tactical cover based on officer personality`).
5. **Vehicle Ownership + Theft System**: Ownership registry (`Owner`, `Vehicle ID`, `Type`, `Condition`, `Fuel`, `Keys`, `Alarm`, `Security`, `Location`), locked vs unlocked forced entry / alarm, occupied vehicle threat/ejection, NPC driver flee/resist/surrender/fight, crime reporting across cars, bikes, motorcycles, trucks, and emergency vehicles.
6. **Investigation & Clue System**: Clue inspection, evidence collection (blood trails, abandoned vehicles, phones, CCTV, notes, radio broadcasts, photos, broken doors), survivor testimony, unlocking story locations/decisions via evidence.
7. **Flashback System**: Story memory engine supporting Cinematic Flashbacks, Playable Flashbacks (controlling past character/setting), Fragmented Memories, and Environmental Memories triggered by locations.
8. **AAA Opening Experience & Story Progression Interface**: Boot Logo -> Engine Load -> Main Menu (`NEW GAME`, `CONTINUE`, `CHAPTERS`, `BUCKET LIST`, `CHARACTERS`, `SETTINGS`, `EXIT`) -> Opening Cinematic -> Playable Prologue. Story progress dashboard tracking Story %, Missions, Clues, Characters, Flashbacks, Bucket List, and Major Decisions.
9. **Zom 100-Inspired Bucket List & Mystery Structure**: 6-Stage narrative progression: Pre-Apocalypse (funny/daily life) -> Outbreak Chaos -> Freedom Phase (100-Item Bucket List, steals vehicles, visits places, meets survivors) -> Deeper Outbreak Mystery Discovery -> Survivor Relationships & Betrayal -> City Collapse & Multiple Outcomes.
10. **Systemic Emergent Story Creation**: Unscripted domino chain reactions (stolen bike -> police report -> traffic crash -> ambulance -> crowd -> noise attracts zombies -> zombies attack -> crowd flees into dark building -> power failure -> emergency lights -> investigation clue found).

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

### PHASE 0 — Audit & Foundation Lock (COMPLETED)
- **Objective**: Complete repository inventory, document baseline performance, create event registry and dependency map.
- **Deliverables**: `foundation_lock.md`, `system_dependency_map.md`, `event_contracts.md`, `migration_plan.md`, `baseline_report.md`.
- **Status**: COMPLETED.

### PHASE 1 — Event Foundation & Payload Validation (COMPLETED)
- **Objective**: Implement dynamic schema validator and circular telemetry history buffer for `EventBus`.
- **Deliverables**: `src/Core/EventValidator.js`.
- **Status**: COMPLETED.

### PHASE 2 — Simulation Core & Early Persistence Schema (COMPLETED)
- **Objective**: Establish master serializable JSON state schema and integrate `toJSON()` / `fromJSON()` into `GameState.js`.
- **Deliverables**: `src/Core/StateSchema.js`.
- **Status**: COMPLETED.

### PHASE 3 — World Streaming & Multi-Tier LOD Hierarchy (COMPLETED)
- **Objective**: Partition world into 60m x 60m sectors with NEAR (<75m), MID (75-180m), FAR (180-320m), and UNLOADED (>320m) simulation tiers.
- **Deliverables**: Upgraded `src/World/SectorManager.js` and `src/World/LODManager.js`.
- **Status**: COMPLETED.

---

### PHASE 4 — Real-World GIS Data Pipeline
- **Objective**: Implement local GIS data importer converting GeoJSON/OSM footprint datasets into normalized city graphs with procedural generation fallback.
- **Dependencies**: Depends on Phase 3. Blocks Phase 5, Phase 6.
- **Existing Systems Affected**: `src/World/CityBuilder.js`.
- **New Files**: `src/World/GISDataParser.js`, `src/World/CityImporter.js`.
- **Modified Files**: `src/World/CityBuilder.js`.
- **Data Contracts**: City graph JSON `{ nodes, edges, footprints, POIs, districts }`.
- **Runtime Behavior**: Parses GeoJSON road/building data, constructing graph nodes & polygons. If absent, falls back to procedural layout.
- **Performance Budget**: Initial load $<400\text{ms}$, 0 per-frame HTTP requests.
- **Acceptance Criteria**: Normalizes GIS data; fallback works when data absent; 60 FPS maintained; 0 console errors.

---

### PHASE 5 — Procedural 3D City Reconstruction, Landmarks & Night/Building State Engine
- **Objective**: Construct 3D city geometry from GIS graphs with instanced facades, landmarks, and a comprehensive Building State Engine.
- **Dependencies**: Depends on Phase 4. Blocks Phase 6, Phase 12, Phase 13.
- **Existing Systems Affected**: `src/World/CityBuilder.js`, `src/World/PropSystem.js`.
- **New Files**: `src/World/LandmarkManager.js`, `src/World/BuildingStateEngine.js`.
- **Modified Files**: `src/World/CityBuilder.js`.
- **Data Contracts**: Building state schema `{ id, exterior, interior, rooms, doors, windows, lights, powerState, occupants, loot, security, activity, damageState }`.
- **Runtime Behavior**: Generates 3D city blocks across 5 architectural styles; tracks building power states; switches building interior illumination, emergency lighting, window glow, and darkness reactions on power grid updates.
- **Performance Budget**: Draw calls $<150$, geometry memory $<120\text{MB}$.
- **Acceptance Criteria**: Buildings render across 5 styles; BuildingStateEngine tracks power ON/OFF transitions; emergency lighting activates in blackout; 60 FPS maintained.

---

### PHASE 6 — Road Network & Traffic Flow Simulation
- **Objective**: Upgrade `NavigationGraph.js` and `TrafficManager.js` to support multi-lane traffic flow, signal timing, and siren lane merging.
- **Dependencies**: Depends on Phase 5. Blocks Phase 7, Phase 13, Phase 20.
- **Existing Systems Affected**: `src/World/NavigationGraph.js`, `src/Traffic/TrafficManager.js`, `src/Traffic/TrafficCar.js`.
- **Modified Files**: `src/World/NavigationGraph.js`, `src/Traffic/TrafficManager.js`, `src/Traffic/TrafficCar.js`.
- **Data Contracts**: Lane waypoint nodes `{ id, lane, direction, connections, isIntersection }`.
- **Runtime Behavior**: Civilian traffic follows lane waypoints, obeys light signals, and merges into right lane when emergency sirens approach.
- **Performance Budget**: 30 active traffic vehicles update $<1.2\text{ms}$ total per frame.
- **Acceptance Criteria**: Vehicles navigate multi-lane junctions cleanly; sirens trigger merging; carjacking functionality intact; 60 FPS maintained.

---

### PHASE 7 — Vehicle Physics, Ownership & Multi-Zone Damage Deformation
- **Objective**: Implement Pacejka tire slip physics, multi-zone deformation, and a comprehensive Vehicle Ownership & Theft System.
- **Dependencies**: Depends on Phase 6. Blocks Phase 8, Phase 20.
- **Existing Systems Affected**: `src/Vehicles/VehicleBase.js`, `src/Vehicles/VehicleManager.js`.
- **New Files**: `src/Vehicles/VehicleOwnershipRegistry.js`.
- **Modified Files**: `src/Vehicles/VehicleBase.js`, `src/Vehicles/VehicleManager.js`.
- **Data Contracts**: Vehicle state schema `{ vehicleId, owner, type, condition, fuel, keys, alarm, security, position }`.
- **Runtime Behavior**: Tracks vehicle keys/locks/alarms; handles locked forced entry, hotwiring, occupant ejection, NPC driver flee/fight responses, and theft crime reports across cars, bikes, motorcycles, trucks, and emergency vehicles.
- **Performance Budget**: Vehicle physics calculation $<0.8\text{ms}$ per frame.
- **Acceptance Criteria**: Vehicle theft handles unlocked/locked/occupied states; alarm triggers police report; tire slip & deformation intact; 60 FPS maintained.

---

### PHASE 8 — Human Character Model Foundation, Skeletons & Tactical Police Behavior
- **Objective**: Upgrade human character models, skeletal rigs, and implement physical officer exit and tactical human arrest behaviors.
- **Dependencies**: Depends on Phase 3, Phase 7. Blocks Phase 9, Phase 10, Phase 20.
- **Existing Systems Affected**: `src/NPC/NPCBase.js`, `src/Police/PoliceManager.js`.
- **New Files**: `src/Police/PoliceOfficerAI.js`.
- **Modified Files**: `src/NPC/NPCBase.js`, `src/Police/PoliceManager.js`.
- **Data Contracts**: Police arrest command schema `{ officerId, targetPlayer, commandState, personality }`.
- **Runtime Behavior**: Police cruisers arrive, stop, officers exit vehicle, draw weapons, approach player, issue verbal "STOP!" commands, and transition to handcuffing on surrender or tactical cover/pursuit on flight/fight.
- **Performance Budget**: Human model update $<0.5\text{ms}$ per entity.
- **Acceptance Criteria**: Police officers physically exit cars and issue verbal/drawn-weapon arrest commands; surrender & pursuit branches work cleanly; 60 FPS maintained.

---

### PHASE 9 — Human Animation Architecture, IK & Interaction Manager
- **Objective**: Implement layered animation state machine, inverse kinematics (IK), foot placement, and contextual interactions (lockpicking, car break-ins, flashlights).
- **Dependencies**: Depends on Phase 8. Blocks Phase 10, Phase 14, Phase 21.
- **Existing Systems Affected**: `src/NPC/NPCModel.js`, `src/Player/InteractionSystem.js`.
- **New Files**: `src/Animation/AnimationStateMachine.js`, `src/Animation/IKController.js`.
- **Modified Files**: `src/NPC/NPCModel.js`, `src/Player/InteractionSystem.js`.
- **Data Contracts**: Animation pose state `{ clipName, weight, ikTargets }`.
- **Runtime Behavior**: Blends locomotion poses, calculates ground foot IK, and executes physical interaction animations (door handles, forced entry, flashlight holding).
- **Performance Budget**: IK solving $<0.4\text{ms}$ per active character.
- **Acceptance Criteria**: Smooth animation transitions; foot placement aligns with ground geometry; interaction prompts trigger physical IK animations; 60 FPS maintained.

---

### PHASE 10 — Human NPC Brain, Systemic Memory & Dark Navigation
- **Objective**: Upgrade human NPC AI with personality parameters, systemic crime memory, perception cones, and dark building navigation (flashlights/phones/emergency routes).
- **Dependencies**: Depends on Phase 8, Phase 9. Blocks Phase 11, Phase 14, Phase 18.
- **Existing Systems Affected**: `src/NPC/NPCBrain.js`, `src/NPC/NPCPerception.js`, `src/NPC/NPCMemory.js`.
- **Modified Files**: `src/NPC/NPCBrain.js`, `src/NPC/NPCPerception.js`, `src/NPC/NPCMemory.js`.
- **Data Contracts**: Memory profile `{ suspectId, crimesWitnessed, fearLevel, personality, lightSource }`.
- **Runtime Behavior**: NPCs perceive surroundings (126° FOV + hearing); remember suspect identities; draw flashlights or phones in dark blackout buildings; flee or seek emergency lighting during power failures.
- **Performance Budget**: Brain decision evaluation $<0.05\text{ms}$ per NPC.
- **Acceptance Criteria**: NPCs react realistically to dark buildings with flashlights; witness reporting functions; fear/flee states execute seamlessly; 60 FPS maintained.

---

### PHASE 11 — Investigation & Clue System
- **Objective**: Construct an Investigation System for inspecting environmental evidence, finding clues, and advancing story mysteries.
- **Dependencies**: Depends on Phase 10. Blocks Phase 18, Phase 19.
- **Existing Systems Affected**: `src/Core/GameState.js`, `src/UI/UIManager.js`.
- **New Files**: `src/Gameplay/InvestigationManager.js`, `src/Gameplay/EvidenceRegistry.js`.
- **Modified Files**: `src/UI/UIManager.js`.
- **Data Contracts**: Evidence schema `{ clueId, type, title, description, location, associatedMission, isInspected }`.
- **Runtime Behavior**: Player inspects blood trails, abandoned vehicles, phones, CCTV footage, notes, radio broadcasts, photos, and broken doors; evidence gets recorded in the evidence ledger to unlock story locations and decisions.
- **Performance Budget**: Evidence evaluation $<0.1\text{ms}$ per frame.
- **Acceptance Criteria**: Environmental clues render inspectable prompts; collecting evidence logs into UI evidence ledger; evidence unlocks narrative milestones; 60 FPS maintained.

---

### PHASE 12 — Infrastructure & Power Grid Simulation
- **Objective**: Build city-wide electrical grid simulation with substations, district blackout events, and emergency power switches.
- **Dependencies**: Depends on Phase 5. Blocks Phase 13, Phase 17.
- **Existing Systems Affected**: `src/WorldSystems/PowerGrid.js` (or creation), `src/World/CityBuilder.js`.
- **New Files**: `src/WorldSystems/PowerGridManager.js`.
- **Modified Files**: `src/World/CityBuilder.js`.
- **Data Contracts**: Power grid schema `{ districtId, isPowered, substations, activeLoad, blackoutCause }`.
- **Runtime Behavior**: Power grid updates toggle streetlamps, building window glow, traffic signals, and interior lighting per district; triggers emergency lights and NPC panic on blackout.
- **Performance Budget**: Power state update $<0.2\text{ms}$ per tick.
- **Acceptance Criteria**: District power outages turn off street/window lights; emergency lights activate; events emit `POWER_GRID_STATE_CHANGED`; 60 FPS maintained.

---

### PHASE 13 — Functional Public Transport (Metro System)
- **Objective**: Implement persistent 3D underground and elevated metro train network with operational schedules, stations, and subway cars.
- **Dependencies**: Depends on Phase 5, Phase 6, Phase 12. Blocks Phase 17, Phase 23.
- **Existing Systems Affected**: `src/WorldSystems/MetroSystem.js` (or creation).
- **New Files**: `src/WorldSystems/MetroManager.js`, `src/WorldSystems/MetroTrain.js`.
- **Data Contracts**: Metro state schema `{ lineId, stationId, trainId, position, doorState, status }`.
- **Runtime Behavior**: Trains move along subway tracks, stop at stations, open doors, allow player/NPC boarding, and shut down during district blackout events.
- **Performance Budget**: Train physics and track spline calculation $<0.3\text{ms}$ per frame.
- **Acceptance Criteria**: Metro trains run on schedule; player can board subway cars; power failure halts train operation; 60 FPS maintained.

---

### PHASE 14 — Zombie Biological Foundation & Perception Threat Engine
- **Objective**: Create realistic zombie biological AI with multi-sensor perception, physical state variations, and persistent outbreak world positioning.
- **Dependencies**: Depends on Phase 8, Phase 10. Blocks Phase 15, Phase 16, Phase 17.
- **Existing Systems Affected**: `src/NPC/NPCBase.js`.
- **New Files**: `src/Zombies/ZombieBase.js`, `src/Zombies/ZombiePerception.js`, `src/Zombies/ZombiePhysicalFSM.js`.
- **Data Contracts**: Zombie state schema `{ zombieId, variant, physicalState, position, target, health, alertLevel }`.
- **Runtime Behavior**: Zombies perceive sight, sound, movement, and smell abstraction; exhibit physical states (stumbling, falling, crawling, climbing, grabbing, missing attacks); migrate towards noise/light sources; exist persistently in the world via outbreak simulation.
- **Performance Budget**: Zombie AI tick $<0.08\text{ms}$ per active zombie.
- **Acceptance Criteria**: Zombies stumble, crawl, grab, and react to gunshots/explosions; perception detects sound & light; no arbitrary player-spawns; 60 FPS maintained.

---

### PHASE 15 — Zombie AI, Hybrid Physics & Swarm Perception
- **Objective**: Implement zombie movement locomotion, physical ragdoll transitions, obstacle climbing, and horde vocalization alerts.
- **Dependencies**: Depends on Phase 14. Blocks Phase 16, Phase 17.
- **Existing Systems Affected**: `src/Zombies/ZombieBase.js`.
- **New Files**: `src/Zombies/ZombieLocomotion.js`.
- **Modified Files**: `src/Zombies/ZombieBase.js`.
- **Data Contracts**: Swarm alert payload `{ swarmId, targetPos, alertRadius, noiseLevel }`.
- **Runtime Behavior**: Zombies climb over low obstacles, stumble upon vehicle collisions, recover from ragdoll knockdowns, and alert nearby zombies via shrieks/groans.
- **Performance Budget**: Hybrid physics update $<0.6\text{ms}$ per frame.
- **Acceptance Criteria**: Vehicles knock down zombies with physics recovery; climbing animations trigger over barriers; swarm alerts ripple through nearby zombies; 60 FPS maintained.

---

### PHASE 16 — Zombie Horde System & Flocking Dynamics
- **Objective**: Build large-scale zombie horde flocking engine using Boids steering algorithms, spatial density grids, and macro vector updates.
- **Dependencies**: Depends on Phase 14, Phase 15. Blocks Phase 17.
- **Existing Systems Affected**: `src/Zombies/ZombieBase.js`.
- **New Files**: `src/Zombies/HordeManager.js`, `src/Zombies/FlockingController.js`.
- **Data Contracts**: Horde state schema `{ hordeId, leaderPos, memberCount, heading, velocity, state }`.
- **Runtime Behavior**: Simulates 100+ zombies moving cohesively as a horde using separation, alignment, cohesion, and target attraction; transitions to NEAR full 3D when player approaches.
- **Performance Budget**: Flocking calculation $<1.0\text{ms}$ for 150 horde entities.
- **Acceptance Criteria**: Large hordes flock cohesively; performance stays within budget; seamless transition from macro vector to NEAR 3D; 60 FPS maintained.

---

### PHASE 17 — Dynamic Outbreak World Director & Presentation Overlay
- **Objective**: Build dynamic Outbreak Director managing city infection progression (Stage 0 to 9), military quarantine barricades, emergency broadcasts, and HUD overlays.
- **Dependencies**: Depends on Phase 12, Phase 13, Phase 16. Blocks Phase 18.
- **Existing Systems Affected**: `src/WorldSystems/OutbreakDirector.js` (or creation).
- **New Files**: `src/WorldSystems/OutbreakDirector.js`.
- **Data Contracts**: Outbreak state schema `{ stage, stageName, infectedPercentage, quarantinedDistricts, emergencyBroadcastText }`.
- **Runtime Behavior**: Advances outbreak stages over time or via story events; spawns military checkpoints, abandoned vehicles, barrier props, and emergency radio announcements.
- **Performance Budget**: Director tick $<0.1\text{ms}$ per second.
- **Acceptance Criteria**: Outbreak stages advance cleanly; barricades and environmental debris spawn in late stages; HUD announcements display; 60 FPS maintained.

---

### PHASE 18 — Story Engine, Mission Manager, Branching Dialogue & Systemic Emergent Chain
- **Objective**: Build Zom 100-inspired 6-stage narrative engine, branching dialogue, mission framework, and Systemic Emergent Story chain reactions.
- **Dependencies**: Depends on Phase 10, Phase 11, Phase 17. Blocks Phase 19, Phase 23.
- **Existing Systems Affected**: `src/Missions/MissionManager.js`.
- **New Files**: `src/Story/StoryEngine.js`, `src/Story/DialogueManager.js`, `src/Gameplay/EmergentStoryChain.js`.
- **Modified Files**: `src/Missions/MissionManager.js`.
- **Data Contracts**: Story state schema `{ currentChapter, completedChapters, storyFlags, relationships, bucketListProgress }`.
- **Runtime Behavior**: Manages story chapters; triggers branching dialogue trees; evaluates systemic chain reactions (theft -> police pursuit -> traffic accident -> emergency response -> zombie swarm attraction -> building blackout -> clue discovery).
- **Performance Budget**: Story & Emergent evaluation $<0.2\text{ms}$ per frame.
- **Acceptance Criteria**: Story missions progress cleanly; dialogue options affect character relationships; emergent systemic chain reactions function without script breaking; 60 FPS maintained.

---

### PHASE 19 — Live Simulation Cinematic & Flashback Director
- **Objective**: Build in-engine Cinematic & Flashback Director supporting Cinematic Flashbacks, Playable Flashbacks (controlling past character/setting), Fragmented Memories, and Environmental Memories.
- **Dependencies**: Depends on Phase 11, Phase 18. Blocks Phase 23.
- **Existing Systems Affected**: `src/Player/CameraController.js`, `src/UI/UIManager.js`.
- **New Files**: `src/Cinematics/CinematicDirector.js`, `src/Cinematics/FlashbackEngine.js`.
- **Modified Files**: `src/Player/CameraController.js`.
- **Data Contracts**: Flashback sequence schema `{ flashbackId, type, sceneData, playerCharacter, audioTrack, duration }`.
- **Runtime Behavior**: Smoothly transitions camera and lighting into memory flashbacks; allows full player control during Playable Flashbacks; overlays color filters and audio cues during Fragmented Memories.
- **Performance Budget**: Camera spline calculation $<0.2\text{ms}$ per frame.
- **Acceptance Criteria**: Flashbacks trigger and return cleanly to present gameplay; Playable Flashbacks swap controls seamlessly; 60 FPS maintained.

---

### PHASE 20 — Police & Emergency Multi-Faction Response
- **Objective**: Upgrade Police and Emergency response with multi-unit tactical coordination, SWAT perimeter containment, and paramedic triage.
- **Dependencies**: Depends on Phase 6, Phase 7, Phase 8. Blocks Phase 21, Phase 25.
- **Existing Systems Affected**: `src/Police/PoliceManager.js`, `src/WorldSystems/EmergencyServices.js`.
- **Modified Files**: `src/Police/PoliceManager.js`, `src/WorldSystems/EmergencyServices.js`.
- **Data Contracts**: Faction response schema `{ faction, unitType, position, targetEntity, tacticState }`.
- **Runtime Behavior**: SWAT units deploy spike strips and armors at 4-5 stars; paramedics treat injured civilians; fire trucks spray water cannons; factions fight zombies when encountered.
- **Performance Budget**: Tactical coordination tick $<0.4\text{ms}$ per frame.
- **Acceptance Criteria**: Multi-unit tactical pursuits execute cleanly; emergency services react to civilian injuries; police fight zombies during outbreak; 60 FPS maintained.

---

### PHASE 21 — Weapon Arsenal Feel, Ballistics & Multi-Zone Fire
- **Objective**: Upgrade combat ballistics with weapon recoil, bloom, penetrations, hit reactions, and multi-zone fire propagation.
- **Dependencies**: Depends on Phase 9, Phase 20. Blocks Phase 22, Phase 25.
- **Existing Systems Affected**: `src/Combat/WeaponSystem.js`, `src/Combat/ProjectileManager.js`.
- **Modified Files**: `src/Combat/WeaponSystem.js`, `src/Combat/ProjectileManager.js`.
- **Data Contracts**: Weapon state schema `{ weaponId, ammo, reserveAmmo, fireRate, spread, recoil, hitZones }`.
- **Runtime Behavior**: Weapons feature distinct impulse recoil, camera shake, visual muzzle flash, hit zone damage multipliers (head, torso, limbs), and surface penetration.
- **Performance Budget**: Projectile raycasting $<0.5\text{ms}$ per frame.
- **Acceptance Criteria**: Guns recoil & bloom realistically; headshots trigger instant zombie kills; ricochets & surface sparks execute cleanly; 60 FPS maintained.

---

### PHASE 22 — Atmospheric Urban Weather, Multi-Layer Lighting & Web Audio
- **Objective**: Build dynamic urban weather (fog, rain, storm), multi-layer sodium/emissive lighting, and synthesized procedural audio.
- **Dependencies**: Depends on Phase 12, Phase 21. Blocks Phase 23, Phase 25.
- **Existing Systems Affected**: `src/Weather/WeatherManager.js`, `src/Audio/SoundEngine.js`.
- **Modified Files**: `src/Weather/WeatherManager.js`, `src/Audio/SoundEngine.js`.
- **Data Contracts**: Weather state schema `{ type, intensity, rainDensity, fogDensity, thunderActive }`.
- **Runtime Behavior**: Rain creates puddles with reflections; fog reduces perception distance; Web Audio plays spatial rain, engine pitch, gunshots, and radio stations.
- **Performance Budget**: Audio synthesis and weather particle update $<0.6\text{ms}$ per frame.
- **Acceptance Criteria**: Weather transitions smoothly; rainy puddle reflections render; audio engine plays spatialized 3D sounds; 60 FPS maintained.

---

### PHASE 23 — 100-Item Bucket List System, AAA Opening Experience & Deep Persistence Engine
- **Objective**: Build the 100-Item Bucket List, AAA Start Menu & Progress Dashboard, Opening Experience sequence, and Deep Persistence Engine.
- **Dependencies**: Depends on Phase 2, Phase 11, Phase 13, Phase 18, Phase 19, Phase 22. Blocks Phase 24, Phase 25.
- **Existing Systems Affected**: `src/SaveSystem/SaveManager.js`, `src/UI/UIManager.js`.
- **New Files**: `src/Gameplay/BucketListManager.js`, `src/UI/StartMenu.js`, `src/UI/ProgressDashboard.js`, `src/Core/BootSequence.js`.
- **Modified Files**: `src/SaveSystem/SaveManager.js`, `src/UI/UIManager.js`.
- **Data Contracts**: Master save JSON `{ version, timestamp, player, economy, district, outbreakStage, powerGridState, metroState, storyState, bucketListProgress, cluesFound, charactersMet, flashbacksUnlocked, destroyedProps, infectedNPCs, sectors }`.
- **Runtime Behavior**: Boots to Logo -> Loading -> AAA Start Menu (`NEW GAME`, `CONTINUE`, `CHAPTERS`, `BUCKET LIST`, `CHARACTERS`, `SETTINGS`, `EXIT`); displays detailed Story Progress Dashboard; tracks 100 Bucket List tasks; serializes entire world state to localStorage/JSON.
- **Performance Budget**: Save/Load serialization $<50\text{ms}$, 0 frame drop during auto-save.
- **Acceptance Criteria**: Start Menu & Progress Dashboard functional; Opening sequence boots smoothly; Bucket List items update on triggers; Save/Load restores 100% world state; 60 FPS maintained.

---

### PHASE 24 — Developer Debug Suite (F1–F9 Overlays) & Performance Throttle Engine
- **Objective**: Construct developer debug overlays (F1-F9 keys) for culling bounds, sector grids, AI state vectors, event logs, memory profiling, and FPS throttling.
- **Dependencies**: Depends on Phase 23. Blocks Phase 25.
- **Existing Systems Affected**: `src/Tools/DebugConsole.js`, `src/Tools/PerformanceStats.js`.
- **New Files**: `src/Tools/DebugSuite.js`.
- **Modified Files**: `src/Tools/DebugConsole.js`.
- **Data Contracts**: Telemetry debug schema `{ fps, frameTime, sectorCount, entityCounts, drawCalls, memoryMB }`.
- **Runtime Behavior**: F1 toggles HELP, F2 toggles SECTORS & LOD, F3 toggles NAVGRAPH, F4 toggles COLLIDERS, F5 toggles ENTITY FSM, F6 toggles EVENT LOG, F7 toggles AUDIO, F8 toggles WEATHER/TIME, F9 toggles TELEMETRY.
- **Performance Budget**: Debug overlay render $<0.2\text{ms}$ when active; $0\text{ms}$ when toggled off.
- **Acceptance Criteria**: F1-F9 keys toggle debug overlays cleanly; telemetry displays live metrics; 0 console errors; 60 FPS maintained.

---

### PHASE 25 — Master Vertical-Slice Integration & Polish
- **Objective**: Final master integration and polish across all 6 architecture layers, running stress-testing protocols to ensure a AAA persistent open-world survival experience.
- **Dependencies**: Depends on Phase 1 through Phase 24.
- **Existing Systems Affected**: Entire codebase (`main.js` and all subsystems).
- **Modified Files**: `main.js`.
- **Data Contracts**: Master Engine Contract v5.0.
- **Runtime Behavior**: Comprehensive survival game experience combining real GIS city reconstruction, multi-tier LOD hierarchy, power grid & metro infrastructure, systemic humans & zombies, tactical police arrest, vehicle ownership/theft, evidence investigation, flashbacks, 100-item bucket list, AAA opening menu, and emergent systemic storytelling.
- **Performance Budget**: 60 FPS in standard play (~16.7ms frame time), $\ge$45 FPS during stress scenes.
- **Acceptance Criteria**:
  - Full end-to-end playability from Boot Logo to Final Mission.
  - 0 JavaScript console errors or uncaught exceptions.
  - 60 FPS baseline maintained.
  - 100% pass rate on all Phase Gate verification checks.
- **Deliverables**: Final **FreeWorld — Ultimate Real-City Apocalypse** Master Production Release.

---

## 🔍 Verification Protocol
Every phase will execute under strict objective verification:
- Server running at `http://localhost:8085/`.
- 0 console errors.
- Target FPS: 60 FPS in normal scenes, $\ge$45 FPS in stress scenes.
- Zero broken existing controls or regression bugs.
