# FreeWorld — Event Contracts Master Specification (v5.0)

All inter-module communication is mediated asynchronously by `events` (`EventBus.js`) and validated by `EventValidator.js`. Every event payload follows a strict contract:

---

## 1. Crime & Law Enforcement Chain

### `CrimeCommitted` / `CRIME_COMMITTED`
```json
{
  "type": "CARJACKING | ASSAULT | SHOOTING | EXPLOSION | PROPERTY_DAMAGE",
  "severity": 1,
  "position": { "x": 0, "y": 0, "z": 0 },
  "perpetrator": "Object | null"
}
```

### `WitnessDetected` / `WITNESS_DETECTED`
```json
{
  "witness": "NPCBrain",
  "crimeType": "String",
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

### `CCTVRecorded`
```json
{
  "cameraId": "cctv_dt_01",
  "position": { "x": 0, "y": 0, "z": 0 },
  "targetEntity": "Object | null",
  "timestamp": 1726050000000
}
```

### `EvidenceCreated` / `EVIDENCE_CREATED`
```json
{
  "type": "WITNESS_STATEMENT | CCTV_FOOTAGE | CASING | BLOOD | ACOUSTIC",
  "position": { "x": 0, "y": 0, "z": 0 },
  "confidence": 45.0
}
```

### `PoliceDispatched` / `POLICE_DISPATCHED`
```json
{
  "position": { "x": 0, "y": 0, "z": 0 },
  "priority": 1,
  "unitCount": 2
}
```

### `VehiclePursuitStarted`
```json
{
  "targetVehicle": "VehicleBase",
  "pursuitUnits": 3,
  "wantedLevel": 3
}
```

### `PoliceVehicleStopped`
```json
{
  "unitId": "cop_unit_04",
  "position": { "x": 0, "y": 0, "z": 0 },
  "reason": "PIT_MANEUVER | BLOCKADE | ARRIVAL"
}
```

### `OfficerExitedVehicle`
```json
{
  "officerId": "officer_12",
  "unitId": "cop_unit_04",
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

### `ArrestCommandIssued`
```json
{
  "targetPlayer": "PlayerController",
  "officerId": "officer_12"
}
```

### `PlayerSurrendered`
```json
{
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

### `ArrestCompleted` / `ARREST_COMPLETED`
```json
{
  "location": { "x": 0, "y": 0, "z": 0 },
  "fineAmount": 1500
}
```

---

## 2. Vehicle & Damage Chain

### `VehicleHit` / `VEHICLE_HIT`
```json
{
  "vehicle": "VehicleBase",
  "impulse": 2400.0,
  "hitZone": "engine | fuel_tank | body | wheels",
  "attacker": "Object | null"
}
```

### `VehicleDamaged`
```json
{
  "vehicle": "VehicleBase",
  "damageAmount": 25.0,
  "part": "engine | hood | tire_fl"
}
```

### `FuelLeaking` / `VEHICLE_FUEL_LEAK`
```json
{
  "vehicle": "VehicleBase",
  "rate": 0.5,
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

### `VehicleIgnited` / `VEHICLE_IGNITED`
```json
{
  "vehicle": "VehicleBase",
  "temperature": 450.0
}
```

### `VehicleBurning` / `VEHICLE_BURNING`
```json
{
  "vehicle": "VehicleBase",
  "temperature": 800.0
}
```

### `VehicleExploded` / `VEHICLE_EXPLODED`
```json
{
  "vehicle": "VehicleBase",
  "position": { "x": 0, "y": 0, "z": 0 },
  "blastRadius": 14.0
}
```

### `ExplosionOccurred`
```json
{
  "position": { "x": 0, "y": 0, "z": 0 },
  "radius": 15.0,
  "damage": 100,
  "source": "VEHICLE | GRENADE | BARREL"
}
```

---

## 3. Apocalypse & Outbreak Chain

### `InfectionDetected`
```json
{
  "entityId": "npc_402",
  "location": { "x": 0, "y": 0, "z": 0 },
  "strain": "ALPHA_PARASITE"
}
```

### `NPCInfected`
```json
{
  "npcId": "npc_402",
  "position": { "x": 0, "y": 0, "z": 0 },
  "source": "BITE | AIRBORNE | WATER"
}
```

### `InfectionProgressed`
```json
{
  "npcId": "npc_402",
  "stage": 2,
  "symptoms": ["FEVER", "AGGRESSION", "NECROSIS"]
}
```

### `NPCTransformed`
```json
{
  "npcId": "npc_402",
  "zombieType": "RUNNER | STUMBLER | TANK",
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

### `ZombieSpawned`
```json
{
  "zombieId": "z_1004",
  "type": "STUMBLER",
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

### `ZombieDetectedPlayer`
```json
{
  "zombieId": "z_1004",
  "distance": 12.5,
  "sightCone": true
}
```

### `ZombieHeardNoise`
```json
{
  "zombieId": "z_1004",
  "soundPosition": { "x": 0, "y": 0, "z": 0 },
  "volume": 85.0
}
```

### `ZombieAttackStarted`
```json
{
  "zombieId": "z_1004",
  "targetEntity": "PlayerController"
}
```

### `ZombieAttackHit`
```json
{
  "zombieId": "z_1004",
  "targetEntity": "PlayerController",
  "damage": 15
}
```

### `ZombieKilled` / `ZOMBIE_KILLED`
```json
{
  "zombieId": "z_1004",
  "killer": "Player",
  "weapon": "VORTEX-9"
}
```

### `HordeFormed` / `ZOMBIE_HORDE_FORMED`
```json
{
  "hordeId": "horde_12",
  "count": 45,
  "origin": { "x": 0, "y": 0, "z": 0 },
  "destination": { "x": 0, "y": 0, "z": 0 }
}
```

### `HordeDispersed`
```json
{
  "hordeId": "horde_12",
  "reason": "TARGET_LOST | EXPLOSION"
}
```

### `OutbreakEscalated` / `OUTBREAK_STAGE_CHANGED`
```json
{
  "stage": 3,
  "stageName": "LOCALIZED_OUTBREAK",
  "description": "Emergency services overwhelmed in Harbor District."
}
```

---

## 4. Buildings & Infrastructure Chain

### `BuildingEntered`
```json
{
  "buildingId": "bldg_downtown_01",
  "interiorId": "interior_lobby_01"
}
```

### `BuildingExited`
```json
{
  "buildingId": "bldg_downtown_01"
}
```

### `PowerChanged` / `POWER_GRID_STATE_CHANGED`
```json
{
  "district": "Downtown | Harbor | Financial | Heights",
  "isPowered": false,
  "cause": "SUBSTATION_BREACH | OVERLOAD"
}
```

### `BuildingBlackout`
```json
{
  "buildingId": "bldg_downtown_01",
  "district": "Downtown"
}
```

### `EmergencyLightsActivated`
```json
{
  "buildingId": "bldg_downtown_01"
}
```

### `BuildingDamaged`
```json
{
  "buildingId": "bldg_downtown_01",
  "damageAmount": 40.0
}
```

### `BuildingLocked`
```json
{
  "buildingId": "bldg_downtown_01",
  "lockLevel": "KEYCARD_REQUIRED"
}
```

### `BuildingInfested`
```json
{
  "buildingId": "bldg_downtown_01",
  "zombieCount": 24
}
```

### `BuildingOverrun`
```json
{
  "buildingId": "bldg_downtown_01"
}
```

### `SafehouseActivated`
```json
{
  "safehouseId": "safehouse_downtown",
  "location": { "x": 0, "y": 0, "z": 0 }
}
```

---

## 5. Story, Narrative & Investigation Chain

### `ClueDiscovered`
```json
{
  "clueId": "clue_memo_01",
  "title": "Lab Outbreak Memo",
  "location": { "x": 0, "y": 0, "z": 0 }
}
```

### `InvestigationUpdated`
```json
{
  "caseId": "case_01_patient_zero",
  "status": "IN_PROGRESS",
  "newClueId": "clue_memo_01"
}
```

### `FlashbackUnlocked`
```json
{
  "flashbackId": "flashback_night_zero",
  "title": "Night Zero Emergency Call"
}
```

### `FlashbackStarted`
```json
{
  "flashbackId": "flashback_night_zero"
}
```

### `FlashbackCompleted`
```json
{
  "flashbackId": "flashback_night_zero"
}
```

### `CharacterDiscovered`
```json
{
  "characterId": "char_dr_vance",
  "name": "Dr. Vance",
  "faction": "Scientists"
}
```

### `RelationshipChanged`
```json
{
  "faction": "Syndicate",
  "delta": 15,
  "newLevel": 65
}
```

### `DecisionMade`
```json
{
  "decisionId": "dec_save_doctor",
  "choice": "SAVE",
  "impact": "DOCTOR_SURVIVES"
}
```

### `MissionStarted`
```json
{
  "missionId": "m_01_escape",
  "title": "Escape Downtown"
}
```

### `ObjectiveCompleted`
```json
{
  "missionId": "m_01_escape",
  "objectiveIndex": 1
}
```

### `MissionCompleted`
```json
{
  "missionId": "m_01_escape",
  "reward": { "cash": 5000, "rep": 100 }
}
```

### `ChapterStarted` / `STORY_CHAPTER_STARTED`
```json
{
  "chapterId": "ACT_I_OUTBREAK_DAY",
  "title": "Escape from Downtown",
  "objectives": ["Reach Metro Station", "Find Survivor"]
}
```

### `ChapterCompleted`
```json
{
  "chapterId": "ACT_I_OUTBREAK_DAY"
}
```

### `WorldConsequenceTriggered`
```json
{
  "consequenceId": "bridge_quarantined",
  "description": "Bay City Bridge blocked by military."
}
```

### `EndingFlagChanged`
```json
{
  "flag": "cured_city",
  "value": true
}
```
