# FreeWorld — Event Contracts Master Specification (v5.0)

All inter-module communication is mediated asynchronously by `events` (`EventBus.js`). Every event payload follows a strict contract:

---

## 1. Crime & Law Enforcement Chain

### `CRIME_COMMITTED`
```json
{
  "type": "CARJACKING | ASSAULT | SHOOTING | EXPLOSION | PROPERTY_DAMAGE",
  "severity": 1, // 1 to 5
  "position": "Vector3",
  "perpetrator": "Object | null"
}
```

### `WITNESS_DETECTED`
```json
{
  "witness": "NPCBrain",
  "crimeType": "String",
  "position": "Vector3"
}
```

### `EVIDENCE_CREATED`
```json
{
  "type": "WITNESS_STATEMENT | CCTV_FOOTAGE | CASING | BLOOD | ACOUSTIC",
  "position": "Vector3",
  "confidence": 45.0 // 0.0 to 100.0
}
```

### `POLICE_DISPATCHED`
```json
{
  "position": "Vector3",
  "priority": 1,
  "unitCount": 2
}
```

### `WANTED_LEVEL_CHANGED`
```json
{
  "level": 2, // 0 to 5
  "lastKnownPos": "Vector3"
}
```

### `ARREST_COMPLETED`
```json
{
  "location": "Vector3",
  "fineAmount": 1500
}
```

---

## 2. Damage & Emergency Chain

### `VEHICLE_HIT`
```json
{
  "vehicle": "VehicleBase",
  "impulse": 2400.0,
  "hitZone": "engine | fuel_tank | body | wheels"
}
```

### `FUEL_LEAKING`
```json
{
  "vehicle": "VehicleBase",
  "rate": 0.5,
  "position": "Vector3"
}
```

### `VEHICLE_IGNITED`
```json
{
  "vehicle": "VehicleBase",
  "temperature": 450.0
}
```

### `VEHICLE_EXPLODED`
```json
{
  "vehicle": "VehicleBase",
  "position": "Vector3",
  "blastRadius": 14.0
}
```

### `EMERGENCY_DISPATCHED`
```json
{
  "serviceType": "ambulance | fire",
  "targetPosition": "Vector3",
  "targetEntity": "Object | null"
}
```

---

## 3. Infrastructure & World Reaction Chain

### `POWER_GRID_STATE_CHANGED`
```json
{
  "district": "Downtown | Harbor | Financial | Heights",
  "isPowered": false,
  "cause": "SUBSTATION_BREACH | OVERLOAD"
}
```

### `METRO_STATUS_UPDATE`
```json
{
  "lineId": "RED_LINE",
  "status": "OPERATIONAL | DELAYED | STOPPED | EMERGENCY_LOCKDOWN",
  "currentStation": "Central Station"
}
```

---

## 4. Zombie & Outbreak Chain

### `OUTBREAK_STAGE_CHANGED`
```json
{
  "stage": 3, // 0 (Normal) to 9 (Collapse)
  "stageName": "LOCALIZED_OUTBREAK",
  "description": "Emergency services overwhelmed in Harbor District."
}
```

### `ZOMBIE_HORDE_FORMED`
```json
{
  "hordeId": "horde_12",
  "count": 45,
  "origin": "Vector3",
  "destination": "Vector3"
}
```

---

## 5. Story & Cinematic Chain

### `STORY_CHAPTER_STARTED`
```json
{
  "chapterId": "ACT_I_OUTBREAK_DAY",
  "title": "Escape from Downtown",
  "objectives": ["Reach Metro Station", "Find Survivor"]
}
```

### `BUCKET_LIST_ITEM_COMPLETED`
```json
{
  "itemId": 14,
  "title": "Drive Across Bay City Bridge During Outbreak",
  "category": "ADVENTURE"
}
```
