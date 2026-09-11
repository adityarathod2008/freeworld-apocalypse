# FreeWorld Engine — Save State Schema Specification (V5.0 Release)

## Schema Overview
The Save System uses JSON serialization version `5.0`. Save files are automatically validated against `SaveSchema` before writing to or restoring from `localStorage` under the key `GAME_FREEWORLD_SAVE_V5`.

---

## V5 JSON Save Schema Definition

```json
{
  "saveVersion": "5.0",
  "saveTimestamp": 1726090000000,
  "playerState": {
    "position": { "x": 15.2, "y": 0.5, "z": -24.8 },
    "rotation": 1.57,
    "health": 100,
    "armor": 100,
    "stamina": 100,
    "currentWeapon": "weapon_rifle"
  },
  "economyState": {
    "cash": 15400,
    "bankBalance": 45000,
    "ownedProperties": ["safehouse_pier4", "garage_downtown"]
  },
  "worldState": {
    "timeOfDay": 14.5,
    "weather": "CLEAR",
    "masterPowerOnline": true,
    "districtSafety": {
      "Downtown Core": 85,
      "Financial District": 90,
      "Harbor District": 70,
      "Heights Residential": 95,
      "Suburbs": 100
    }
  },
  "policeState": {
    "wantedLevel": 0,
    "policeDispatchActive": false,
    "boloPlates": ["FW-9999-SL"]
  },
  "buildingStates": {
    "bldg_safehouse_01": {
      "state": "SAFEHOUSE",
      "generatorFuel": 85,
      "zombieAccessBlocked": true
    }
  },
  "investigationState": {
    "cluesFound": ["CLUE_CRIME_SCENE_NOTE", "CLUE_BIO_DATA"],
    "unlockedObjectives": ["obj_find_vance_lab"]
  },
  "storyState": {
    "chapterId": 3,
    "chapterName": "Chapter 3: Freedom",
    "missionId": "m_ch3_escape",
    "objectiveId": "obj_reach_harbor",
    "missionStatus": "IN_PROGRESS",
    "chapterStatus": "ACTIVE",
    "cluesFound": ["CLUE_CRIME_SCENE_NOTE", "CLUE_BIO_DATA"],
    "flashbacksUnlocked": ["fb_biolabs_spill"],
    "charactersDiscovered": ["char_marco", "char_dr_vance", "char_miller"],
    "relationships": {
      "char_marco": 60,
      "char_dr_vance": 35,
      "char_miller": 40
    },
    "majorDecisions": ["CHOICE_TRUST_MARCO"],
    "worldConsequences": ["CONSEQUENCE_MARCO_ALLIED"],
    "endingFlags": ["ENDING_EXPOSE_NEXUS"],
    "bucketListProgress": 2,
    "storyCompletionPercentage": 35
  },
  "bucketListState": {
    "completedItems": ["bl_adv_01", "bl_trv_01"]
  },
  "persistenceState": {
    "saveCount": 5,
    "lastSaveTime": 1726090000000
  }
}
```
