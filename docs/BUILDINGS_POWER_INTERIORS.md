# FREEWORLD — BUILDINGS, INTERIORS & POWER GRID SYSTEM SPECIFICATION

## 🏙️ OVERVIEW

The **Phase 3 System Architecture** transforms static city building structures into interactive, multi-layered systemic environments equipped with:
1. **9 Authoritative Building States** controlling visual aesthetics, security shutters, door locks, alarm sirens, NPC occupancy, loot tables, and zombie access points.
2. **Procedural Multi-Floor Interior Generator** providing playable rooms, interactive doors, windows, furniture props, lighting fixtures, and staircases.
3. **Multi-Layer Power Grid Simulation (`PowerManager`)** orchestrating central grid power, district power, building circuit breakers, and emergency generators.
4. **Night & Dark Space NPC Behavior Engine** handling flashlight/phone light usage, blackout panic, and avoidance of dark spaces.

---

## 🏛️ BUILDING HIERARCHY

```
Exterior (3D Geometry & Colliders)
 └── Entrance (Interactive Doors & Security Shutters)
      └── Interior (Multi-Floor Hierarchy)
           ├── Rooms (Lobby, Office, Vault, Apartment, Storage, Stairwell)
           │    ├── Doors (Open, Locked, Barricaded, Breached)
           │    ├── Windows (Normal, Broken, Zombie Vaultable)
           │    ├── Furniture & Props (Desks, Chairs, Shelves, Cabinets, Safes)
           │    ├── Lighting (Main Ceiling Fixtures & Emergency Red Beacons)
           │    ├── Power (Circuit Breaker & Emergency Generator Backup)
           │    ├── NPC Occupants (Civilian & Guard Spawn Nodes)
           │    ├── Loot Containers (Cash, Ammo, Health Kits, Keycards)
           │    ├── Structural Damage (0 - 100% Health)
           │    └── Zombie Access Points (Breached Doors, Broken Windows)
```

---

## ⚡ 9 AUTHORITATIVE BUILDING STATES (`BuildingStateEngine.js`)

| Building State | Power Connected | Doors Locked | Security Shutters | Zombie Access | NPC Occupancy | Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`NORMAL`** | ✅ Yes | ❌ No | ❌ Open | ✅ Allowed | 6 | Standard operational business building with full ceiling lighting. |
| **`ACTIVE`** | ✅ Yes | ❌ No | ❌ Open | ✅ Allowed | 12 | High-density commercial activity with elevated interior lighting. |
| **`ABANDONED`** | ❌ No | ❌ No | ❌ Open | ✅ Allowed | 0 | Unpowered, dusty building with scattered loot and cobwebs. |
| **`POWER_FAILURE`** | ❌ No | ⚡ Random | ❌ Open | ✅ Allowed | 2 | Main grid down; low-voltage red emergency lighting active. |
| **`LOCKDOWN`** | ✅ Yes | 🔒 Locked | 🛡️ Closed | ❌ Blocked | 4 | Security lockdown; shutters down, alarms sounding, flashing lights. |
| **`DAMAGED`** | ❌ No | ❌ No | ❌ Open | ✅ Allowed | 0 | Structural damage ($<50\%$ health); broken glass, sparks, debris. |
| **`INFESTED`** | ❌ No | ❌ No | ❌ Open | ✅ Allowed | 0 | Biological infestation; flickering dim lights, fungal growth. |
| **`OVERRUN`** | ❌ No | ❌ No | ❌ Open | ✅ Allowed | 0 | Heavy zombie infestation; heavy blood/debris, high zombie density. |
| **`SAFEHOUSE`** | ✅ Yes (Gen) | 🔒 Locked | ❌ Open | ❌ Blocked | 3 | Fortified survivor haven; persistent generator power, workbench. |

---

## 💡 POWER GRID SYSTEM (`PowerManager.js`)

The power grid operates on a cascading 4-layer hierarchy:

$$\text{Master PowerGrid} \longrightarrow \text{DistrictPower} \longrightarrow \text{BuildingPower} \longrightarrow \text{EmergencyPower}$$

### Cascading Outage Effects
1. **Lighting**: Main ceiling fixtures turn off during outages; red emergency backup lights engage automatically if battery/generator power is present.
2. **Traffic Signals**: Powered intersections operate in `NORMAL_CYCLED` mode. Blackout districts switch to `FLASHING_AMBER` or dark.
3. **Streetlamps**: Sodium streetlamps illuminate automatically at night (19:00 - 06:00) when district power is online.
4. **Sound Atmosphere**: Power loss silences indoor HVAC hums and triggers distant transformer buzzing and alarm chirps.

---

## 🔦 NIGHT & DARK SPACE NPC AI (`NPCBrain.js`)

NPCs perceive ambient lighting levels and react dynamically:
- **Flashlight Deployment**: NPCs carrying flashlights (`hasFlashlight = true`) switch on high-beam flashlights when entering unlit or blacked-out spaces.
- **Phone Illumination**: NPCs without flashlights pull out illuminated smartphone screens.
- **Blackout Panic**: Sudden power loss triggers `SEEKING_LIGHT` behavior, prompting civilians to navigate towards lit streetlamps or emergency exits.
- **Dark Space Avoidance**: Civilians avoid unlit dark alleys and infested/overrun building interiors.

---

## 💾 SAVE / LOAD PERSISTENCE (`SaveManager.js`)

All Phase 3 sub-states serialize into authoritative JSON:
- Building state (`currentState`, `previousState`, `health`, `doorsLocked`, `shuttersClosed`, `generatorFuel`).
- Power grid statuses (`isMasterGridOnline`, `districtPower`, circuit breaker states).
- Interior door lock statuses and barricade health.

---

## 🧪 VERIFICATION

Run automated Phase 3 verification suite:
```bash
node tests/test_phase3_buildings_power.js
```
- **37 / 37 Unit & Integration Tests Passed**:
  - All 9 building state transitions & property assertions.
  - Multi-floor interior room hierarchy, furniture, lighting, and loot generation.
  - Power grid blackout cascade and traffic signal state shifts.
  - NPC flashlight and phone light activation in dark space.
  - Save/Load state serialization & deserialization.
