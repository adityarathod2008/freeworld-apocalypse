# FREEWORLD — ULTIMATE REAL-CITY APOCALYPSE
## MASTER TRANSFORMATION & DEVELOPMENT SPECIFICATION v5.0
### IMPLEMENTATION MASTER PLAN v1.3

This master document establishes the authoritative technical blueprint for evolving the existing **FreeWorld** engine into a persistent, living-city survival experience, incorporating the **6-Layer System Architecture + Cross-Cutting Foundation**, **Human Realism Specification**, **9 Building States**, **Persistent Vehicle Theft Loop**, **Story State Machine**, and **28-Point Gameplay Acceptance Test Protocol**.

---

## 🏛️ 6-Layer System Architecture + Cross-Cutting Foundation

```text
                                    FREEWORLD
                                        │
                                  ┌─────┴─────┐
                                  │ GAME STATE│
                                  └─────┬─────┘
                                        │
                                    EVENT BUS
                                        │
┌─────────┬──────────┬──────┬──────┼─────────┬──────────┐
│         │          │      │      │         │          │
WORLD   ENTITY     PLAYER STORY GAMEPLAY  PRESENTATION
│         │          │      │      │         │
City    Humans    Controls Chapters Missions UI/HUD
Roads   Zombies   Inventory Dialogue Clues  Camera
Metro   Vehicles  Interact Flashback Emergent Audio
Power   NPC Brain Equip  Decisions  Bucket  Cinematics
Weather Night/Bldg  Bikes  Characters  Chain  Screen FX
└─────────┴──────────┴──────┴──────┴─────────┴──────────┘
                            │
                  CROSS-CUTTING FOUNDATION
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
Streaming & Sectors    LOD Hierarchy       Persistence Schema & Debug
```

---

## 🎯 Human Realism Specification

All human NPCs and character models must strictly meet these 5 realism pillars:

1. **ANATOMY**: Realistic physical proportions, body mass variations, age spectrum, height distribution, and physical condition.
2. **MATERIALS**: PBR skin shader with subsurface scattering hints, realistic hair cards, clothing fabric folds/textures, eye reflections, and dynamic environmental dirt/wetness accumulating on clothes and skin.
3. **FACIAL**: Expression blending, dynamic eye gaze tracking, natural blinking patterns, lip sync audio hooks, micro-expressions, and smooth emotional transitions (calm, suspicious, terrified, aggressive).
4. **BODY**: Idle breathing animation, balance adjustments, weight transfer during locomotion, momentum preservation during sprints, ground-conforming foot placement, hand IK placement on objects, and collision-aware movement.
5. **ANIMATION**: Smooth locomotion blending (walk, jog, sprint), realistic 90°/180° turning, deceleration stopping, stumbling over obstacles, physics ragdoll falling, ground recovery, climbing over barriers, vehicle entry/exit IK, and environmental hand-touch interactions.

---

## 🏢 Building System & 9 Building States

### Building Hierarchy
`Exterior -> Entrance -> Interior -> Rooms -> Doors -> Windows -> Furniture/Props -> Lighting -> Power -> NPC Occupancy -> Loot -> Damage -> Zombie Accessibility`

### 9 Building States
1. **NORMAL**: Full grid power, civilian occupancy, active interior lighting, window illumination, locked/unlocked doors.
2. **ACTIVE**: High NPC activity, business operation, open shops, commercial lighting.
3. **ABANDONED**: No NPC occupancy, unmaintained interior, lootable props, open/broken doors.
4. **POWER_FAILURE**: Total blackout, emergency exit lights active, NPCs using flashlights/phones or panicking, zombies migrating toward noise.
5. **LOCKDOWN**: Security shutters closed, doors reinforced, emergency strobe lights active, defensive NPC occupants.
6. **DAMAGED**: Structural wall breaches, shattered windows, debris, exposed wiring, smoke/fire particles.
7. **INFESTED**: Zombie population present inside rooms, dark interior, blood trails, barricaded exits.
8. **OVERRUN**: Complete zombie infestation, broken doors/windows, destroyed props, high threat level.
9. **SAFEHOUSE**: Player/Survivor sanctuary, restored generator power, weapon storage, rest beds, save points.

---

## 🚗 Persistent Vehicle Theft Loop

`STEAL VEHICLE -> Owner reaction -> Witness/CCTV/alarm -> Vehicle reported stolen -> Police database -> Vehicle description / plate recognition -> Police search -> Police detection -> Pursuit -> Road interception -> Player escapes / surrenders / fights -> Vehicle recovered OR remains stolen -> Persistent world state`

The world state permanently tracks stolen vehicles: abandoned stolen bikes or cars remain at their exact world coordinates across save/load cycles until towed or destroyed.

---

## 📖 Master Story State Machine (`StoryState`)

```json
{
  "chapterId": "CHAPTER_1_OUTBREAK",
  "missionId": "MISSION_3_METRO_ESCAPE",
  "objectiveId": "OBJ_BREACH_TERMINAL",
  "missionStatus": "IN_PROGRESS",
  "chapterStatus": "ACTIVE",
  "cluesFound": ["CLUE_01_BLOOD_TRAIL", "CLUE_04_CCTV_DISK"],
  "flashbacksUnlocked": ["FLASHBACK_01_PATIENT_ZERO"],
  "charactersDiscovered": ["CHAR_ALICE", "CHAR_OFFICER_REYES"],
  "relationships": { "CHAR_ALICE": 75, "CHAR_OFFICER_REYES": -40 },
  "majorDecisions": { "DECISION_SAVE_SURVIVOR": true },
  "worldConsequences": { "HARBOR_DISTRICT_QUARANTINED": true },
  "endingFlags": {},
  "bucketListProgress": [1, 4, 7, 12],
  "storyCompletionPercentage": 32.5
}
```

The execution pipeline guarantees: `SAVE -> StoryState -> LOAD -> Reconstruct World -> Continue from exact story state`.

---

## 🛑 Standard Phase Completion Gate & 28-Point Gameplay Acceptance Protocol

A phase is **NOT** complete until every standard check and applicable gameplay test passes:

### Standard Technical Gate
- [ ] **Objective implemented**: Core features built & integrated.
- [ ] **Existing functionality verified**: Player movement, driving, camera intact.
- [ ] **New functionality manually tested**: Verified in browser.
- [ ] **Event contracts validated**: Emissions match `event_contracts.md`.
- [ ] **Persistence schema validated**: `toJSON()` / `fromJSON()` serializes cleanly.
- [ ] **Integration verified**: Interacts cleanly with core loop.
- [ ] **0 console errors**: Zero JS runtime errors/warnings.
- [ ] **No uncaught exceptions**: Game loop never crashes.
- [ ] **60 FPS target maintained**: Standard scene runs at ~16.7ms.
- [ ] **$\ge$45 FPS stress floor**: Dense scenes maintain performance.
- [ ] **No broken controls**: Keyboard/mouse/interaction intact.
- [ ] **No visual/physics/AI regression**: Collisions & rendering preserved.
- [ ] **Save/load compatibility**: State restores across ticks.
- [ ] **Debug instrumentation added**: Telemetry hooks created.
- [ ] **Implementation documented**: Docs updated.
- [ ] **Evidence captured**: Browser screenshot/log saved.
- [ ] **Regression test passed**: Test protocol passes cleanly.

### 28-Point Gameplay Acceptance Tests
- [ ] **[ ] Can start New Game**
- [ ] **[ ] Can Continue saved game**
- [ ] **[ ] Can enter/exit buildings**
- [ ] **[ ] Building lighting responds to power grid state**
- [ ] **[ ] NPCs behave appropriately at night (flashlights/phones/emergency routes)**
- [ ] **[ ] Can steal an unoccupied vehicle (lockpicking/hotwiring)**
- [ ] **[ ] Can steal an occupied vehicle (carjacking/driver ejection)**
- [ ] **[ ] Owner reacts appropriately (flee/resist/surrender/fight)**
- [ ] **[ ] Theft can generate evidence (CCTV/alarm/witnesses)**
- [ ] **[ ] Police can detect stolen vehicle via plate/description**
- [ ] **[ ] Police officers physically exit vehicles**
- [ ] **[ ] Officers approach player with drawn weapons & verbal commands**
- [ ] **[ ] Arrest interaction works (Surrender -> Cuff / Run -> Pursuit)**
- [ ] **[ ] Zombies can independently detect player (sight/sound/smell)**
- [ ] **[ ] Zombies can chase player with physical locomotion**
- [ ] **[ ] Zombies can attack player (grapple/bite/strike)**
- [ ] **[ ] Zombies react to sound (gunshots/explosions/sirens)**
- [ ] **[ ] Horde behavior works (flocking dynamics/Boids steering)**
- [ ] **[ ] Infection can transform NPCs into zombies**
- [ ] **[ ] Clues can be discovered in environment**
- [ ] **[ ] Investigation can unlock new story objectives**
- [ ] **[ ] Flashback can trigger (cinematic/playable/memory)**
- [ ] **[ ] Main mission can progress through stages**
- [ ] **[ ] Branching decision changes state & relationships**
- [ ] **[ ] Story completion percentage updates on progress dashboard**
- [ ] **[ ] Bucket-list progress updates on achievements**
- [ ] **[ ] World consequences persist across save states**
- [ ] **[ ] Save → reload reconstructs exact world & story state**

---

## 📋 Full 25 Implementation Phase Roadmap

### 0–3 FOUNDATION
- **PHASE 0**: Audit & Foundation Lock (Completed)
- **PHASE 1**: Event Foundation & Payload Validation (Completed)
- **PHASE 2**: Simulation Core & Early Persistence Schema (Completed)
- **PHASE 3**: World Streaming & Multi-Tier LOD Hierarchy (Completed)

### 4–5 WORLD
- **PHASE 4**: Real-World GIS Data Pipeline
- **PHASE 5**: Procedural 3D City Reconstruction, Landmarks & Building State Engine (9 States)

### 6–7 TRAFFIC + VEHICLES
- **PHASE 6**: Road Network & Multi-Lane Traffic Flow Simulation
- **PHASE 7**: Vehicle Physics, Ownership Registry & Persistent Theft Loop

### 8–11 HUMANS + NPC + INVESTIGATION
- **PHASE 8**: Human Character Model Foundation, Skeletons & Tactical Police Arrest Behavior
- **PHASE 9**: Human Animation Architecture, IK & Interaction Manager
- **PHASE 10**: Human NPC Brain, Systemic Memory & Dark Building Navigation
- **PHASE 11**: Investigation & Clue System

### 12–13 INFRASTRUCTURE + METRO
- **PHASE 12**: Infrastructure & Power Grid Simulation
- **PHASE 13**: Functional Public Transport (Metro System)

### 14–17 ZOMBIES + OUTBREAK
- **PHASE 14**: Zombie Biological Foundation & Multi-Sensor Threat Engine
- **PHASE 15**: Zombie AI, Hybrid Physics & Swarm Perception
- **PHASE 16**: Zombie Horde System & Flocking Dynamics
- **PHASE 17**: Dynamic Outbreak World Director & Presentation Overlay

### 18–19 STORY + CINEMATICS
- **PHASE 18**: Story State Machine, Mission Manager, Branching Dialogue & Emergent Chain
- **PHASE 19**: Live Simulation Cinematic & Flashback Director

### 20–22 POLICE + COMBAT + ATMOSPHERE
- **PHASE 20**: Police & Emergency Multi-Faction Response
- **PHASE 21**: Weapon Arsenal Feel, Ballistics & Multi-Zone Fire
- **PHASE 22**: Atmospheric Urban Weather, Multi-Layer Lighting & Web Audio

### 23 PROGRESSION + PERSISTENCE
- **PHASE 23**: 100-Item Bucket List System, AAA Opening Experience & Deep Persistence Engine

### 24 DEBUG + PERFORMANCE
- **PHASE 24**: Developer Debug Suite (F1–F9 Overlays) & Performance Throttle Engine

### 25 INTEGRATION
- **PHASE 25**: Master Vertical-Slice Integration, 28-Point Acceptance Testing & Release

---

## 🔍 Verification Protocol
Every phase will execute under strict objective verification:
- Server running at `http://localhost:8085/`.
- 0 console errors.
- Target FPS: 60 FPS in normal scenes, $\ge$45 FPS in stress scenes.
- 100% pass on all 28 Gameplay Acceptance Tests upon completion.
