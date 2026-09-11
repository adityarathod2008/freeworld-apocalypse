# FreeWorld Engine — Developer Debugging & Diagnostic Overlays Guide

## Developer Console & Cheats
The developer console can be toggled in-game by pressing backquote (**`** or **~**).

### Console Controls & Commands
- **God Mode**: `events.emit('DEBUG_GOD_MODE')` — Toggles invincibility.
- **Add Cash**: `events.emit('DEBUG_ADD_CASH', 10000)` — Adds $10,000 cash.
- **Clear Wanted**: `events.emit('DEBUG_WANTED_CLEAR')` — Instantly resets wanted stars.
- **Max Wanted**: `events.emit('DEBUG_WANTED_MAX')` — Sets 5-star wanted level.
- **Set Time**: `events.emit('DEBUG_SET_TIME', hour)` — Sets solar hour (0 to 23).
- **Toggle Rain**: `events.emit('DEBUG_TOGGLE_RAIN')` — Toggles storm weather.
- **Spawn Vehicle**: `events.emit('SPAWN_VEHICLE', { type: 'sportsCar' })` — Spawns vehicle near player.
- **Teleport**: `events.emit('TELEPORT_PLAYER', landmarkPosition)` — Teleports player to landmark.

---

## Authoritative F1 – F9 Diagnostic Overlays
FreeWorld features 9 dedicated real-time developer diagnostic overlays accessible via function keys **F1 through F9**:

| Key | Diagnostic Overlay | Telemetry Monitored |
|---|---|---|
| **F1** | **Game State** | Player health/armor, economy cash/bank, solar time of day, active weather, save count. |
| **F2** | **Event Bus** | Real-time event stream logger capturing all internal EventBus message traffic. |
| **F3** | **Humans & NPC Brain** | Active pedestrian count, 8-step brain state distribution, darkness flashlight/phone usage, memory event log count. |
| **F4** | **Zombies & Horde** | Active zombie entity count, archetype variants (Walker, Runner, Brute, Screamer), infection pipeline status, flocking vectors. |
| **F5** | **Vehicles & Traffic** | Registered vehicles, stolen state count, ANPR database watch list, traffic signal phase states. |
| **F6** | **Police & Emergency** | Wanted level, dispatch status, active patrol cruisers, BOLO count, arrest state machine status. |
| **F7** | **Story & Progression** | Current chapter ID/name, mission status, story %, 100-item Bucket List %, clue count, flashback count, character trust scores. |
| **F8** | **Buildings & Power** | Master power grid status, 5 district power states, active building state, generator fuel %, zombie access flags. |
| **F9** | **Performance & Throttling** | Target framerate (60 FPS / 16.7ms), frame render time in ms, 22ms spike frame counter, dynamic throttle level (Level 0 - 3), draw calls. |
