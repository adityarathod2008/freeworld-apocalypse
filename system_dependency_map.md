# FreeWorld — System Dependency Map (v5.0)

## Architectural Graph

```text
                                WORLD SIMULATION (Master Tick)
                                              │
                                         GAME STATE
                                              │
                                          EVENT BUS
                                              │
      ┌───────────────┬───────────────┬───────┴───────┬───────────────┬───────────────┐
      ↓               ↓               ↓               ↓               ↓               ↓
   PLAYER            NPC           VEHICLE         POLICE         COMBAT        INFRASTRUCTURE
      │               │               │               │               │               │
  Controller       Brain           Physics         Dispatch        Weapons        PowerGrid
    Model        Perception       VehicleAI        Evidence       HitReaction       Metro
  Camera          Memory           Damage        WantedSystem    Projectiles     TrafficLights
Interaction      Schedule        Occupants        ArrestSystem        │               │
      │               │               │               │               │               │
      └───────────────┴───────────────┼───────────────┴───────────────┴───────────────┘
                                      ↓
                               WORLD REACTION
                         (Traffic Rerouting, Panics,
                         Emergency Services, Story Events)
```

## Dependency Breakdown

### 1. Central Core Loop
- **`Engine.js`** $\rightarrow$ drives `WorldSimulation`, `PlayerController`, `VehicleManager`, `NPCManager`, `PoliceManager`, `TimeManager`, `WeatherManager`, `EmergencyServices`.
- **`GameState.js`** $\rightarrow$ singleton registry holding player vitals, current district, quality settings, and global stats.
- **`EventBus.js`** $\rightarrow$ decoupled publish/subscribe mediator for all simulation messaging.
- **`EntityManager.js`** $\rightarrow$ spatial query registry (`getEntitiesInRadius()`) supporting targeting, AI, and collision.

### 2. Physical & Spatial Hierarchy
- **`CollisionSystem.js`** $\rightarrow$ spatial hash grid used by `PlayerController`, `VehicleBase`, `VehicleAI`, `PoliceAI`, `EmergencyServices`, `WeaponSystem`.
- **`NavigationGraph.js`** $\rightarrow$ waypoint graph used by `VehicleAI`, `NPCBrain`, `PoliceManager`, `EmergencyServices`.
- **`SectorManager.js` & `LODManager.js`** $\rightarrow$ partition sectors into `NEAR` (<75m), `MID` (75-180m), `FAR` (180-320m), `UNLOADED` (>320m).

### 3. Law Enforcement & Crime Chain
- `CrimeCommitted` $\rightarrow$ `WitnessSystem` / `CCTV` $\rightarrow$ `EvidenceSystem` $\rightarrow$ `WantedSystem` $\rightarrow$ `PoliceManager` $\rightarrow$ `PoliceAI` $\rightarrow$ `ArrestSystem`.

### 4. Vehicle Damage & Emergency Chain
- `VehicleHit` $\rightarrow$ `VehicleDamage` $\rightarrow$ `FuelLeak` $\rightarrow$ `IgnitionCheck` $\rightarrow$ `FireProgression` $\rightarrow$ `Explosion` $\rightarrow$ `EmergencyServices` (Ambulance / Fire Engine).

### 5. Apocalypse Extension Modules (Planned Integration Tiers)
- `Infrastructure` (`PowerGridManager`, `MetroManager`) $\rightarrow$ modifies lighting, transit, NPC panic.
- `Zombies` (`ZombieManager`, `HordeSystem`, `InfectionSystem`) $\rightarrow$ subscribes to acoustic noise, blood, panics, and alters district stages.
- `Story` (`StoryManager`, `CinematicDirector`, `BucketListSystem`) $\rightarrow$ responds to world events and player choices.
