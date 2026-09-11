/**
 * Game FreeWorld - InteriorGenerator (v5.0)
 * Constructs procedural building interior hierarchies: floors, multi-room layouts,
 * interactive doors, windows, furniture props, lighting fixtures, stairwells,
 * loot containers, and zombie access points.
 */

import * as THREE from 'three';

export const ROOM_TYPES = {
  LOBBY: 'LOBBY',
  OFFICE: 'OFFICE',
  VAULT: 'VAULT',
  APARTMENT: 'APARTMENT',
  HALLWAY: 'HALLWAY',
  STORAGE: 'STORAGE',
  BATHROOM: 'BATHROOM',
  STAIRWELL: 'STAIRWELL'
};

export class InteriorGenerator {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Generate an interior structure for a building instance
   */
  generateInterior(building) {
    const bCenter = building.center;
    const bWidth = building.sizeX || 20;
    const bDepth = building.sizeZ || 20;
    const levels = Math.min(building.levels || 3, 4); // Max 4 playable interior floors for performance
    const floorHeight = 3.8;

    const interior = {
      buildingId: building.id,
      floors: [],
      rooms: [],
      doors: [],
      windows: [],
      furniture: [],
      lighting: { mainLights: [], emergencyLights: [] },
      lootContainers: [],
      occupants: [],
      zombieAccessPoints: [],
      powerStatus: { mainPower: true, emergencyPower: false },

      /**
       * Dynamic state updater
       */
      updateState: (state) => {
        this._applyStateToInterior(interior, state);
      },

      /**
       * Dynamic power updater
       */
      setPower: (mainPowered, emergencyPowered) => {
        interior.powerStatus.mainPower = mainPowered;
        interior.powerStatus.emergencyPower = emergencyPowered;
        interior.lighting.mainLights.forEach(light => {
          if (light.mesh) light.mesh.visible = mainPowered;
          if (light.pointLight) light.pointLight.intensity = mainPowered ? (light.defaultIntensity || 1.0) : 0;
        });
        interior.lighting.emergencyLights.forEach(light => {
          const active = !mainPowered && emergencyPowered;
          if (light.mesh) light.mesh.visible = active;
          if (light.pointLight) light.pointLight.intensity = active ? 0.8 : 0;
        });
      }
    };

    // Construct Floors and Rooms
    for (let f = 0; f < levels; f++) {
      const floorY = f * floorHeight;
      const floorObj = { level: f, floorY, rooms: [] };

      // Subdivide floor into 2x2 room layout
      const roomW = bWidth / 2;
      const roomD = bDepth / 2;

      const roomTypes = f === 0 
        ? [ROOM_TYPES.LOBBY, ROOM_TYPES.OFFICE, ROOM_TYPES.STAIRWELL, ROOM_TYPES.STORAGE]
        : [ROOM_TYPES.APARTMENT, ROOM_TYPES.OFFICE, ROOM_TYPES.BATHROOM, ROOM_TYPES.HALLWAY];

      let rIdx = 0;
      for (const rx of [-roomW / 2, roomW / 2]) {
        for (const rz of [-roomD / 2, roomD / 2]) {
          const roomCenter = new THREE.Vector3(bCenter.x + rx, floorY, bCenter.z + rz);
          const rType = roomTypes[rIdx % roomTypes.length];
          rIdx++;

          const room = {
            id: `room_f${f}_${rIdx}`,
            type: rType,
            center: roomCenter,
            width: roomW,
            depth: roomD,
            height: floorHeight,
            bounds: new THREE.Box3(
              new THREE.Vector3(roomCenter.x - roomW / 2, floorY, roomCenter.z - roomD / 2),
              new THREE.Vector3(roomCenter.x + roomW / 2, floorY + floorHeight, roomCenter.z + roomD / 2)
            ),
            lights: []
          };

          // Generate Room Lighting Fixture
          const lightPos = new THREE.Vector3(roomCenter.x, floorY + floorHeight - 0.4, roomCenter.z);
          const mainLight = {
            id: `light_main_${room.id}`,
            position: lightPos.clone(),
            defaultIntensity: 1.2,
            mesh: null
          };
          const emLight = {
            id: `light_em_${room.id}`,
            position: lightPos.clone().add(new THREE.Vector3(0.5, 0, 0)),
            mesh: null
          };

          interior.lighting.mainLights.push(mainLight);
          interior.lighting.emergencyLights.push(emLight);

          // Generate Doors & Windows
          if (f === 0 && rIdx === 1) {
            // Main Entrance Door
            interior.doors.push({
              id: `door_main_${building.id}`,
              position: new THREE.Vector3(roomCenter.x, floorY + 1.2, roomCenter.z + roomD / 2),
              isOpen: false,
              isLocked: false,
              barricadeHealth: 100,
              isEntrance: true
            });
          }

          // Interior Room Door
          interior.doors.push({
            id: `door_${room.id}`,
            position: new THREE.Vector3(roomCenter.x + roomW / 2, floorY + 1.2, roomCenter.z),
            isOpen: false,
            isLocked: building.doorsLocked || false,
            barricadeHealth: 100,
            isEntrance: false
          });

          // Windows
          interior.windows.push({
            id: `win_${room.id}`,
            position: new THREE.Vector3(roomCenter.x, floorY + 1.5, roomCenter.z - roomD / 2),
            isBroken: false,
            zombieVaultable: true
          });

          // Furniture & Loot Containers
          if (rType === ROOM_TYPES.OFFICE || rType === ROOM_TYPES.LOBBY) {
            interior.furniture.push({
              type: 'DESK',
              position: new THREE.Vector3(roomCenter.x - 1, floorY + 0.4, roomCenter.z - 1)
            });
            interior.lootContainers.push({
              id: `loot_${room.id}`,
              position: new THREE.Vector3(roomCenter.x + 1, floorY + 0.5, roomCenter.z + 1),
              isSearched: false,
              items: ['Cash', 'Pistol Ammo', 'Medkit']
            });
          } else if (rType === ROOM_TYPES.STORAGE) {
            interior.furniture.push({
              type: 'SHELF',
              position: new THREE.Vector3(roomCenter.x, floorY + 0.8, roomCenter.z - 1.5)
            });
          }

          // Zombie Access Point
          interior.zombieAccessPoints.push({
            id: `zap_${room.id}`,
            position: new THREE.Vector3(roomCenter.x, floorY + 0.5, roomCenter.z - roomD / 2),
            type: 'WINDOW'
          });

          floorObj.rooms.push(room);
          interior.rooms.push(room);
        }
      }

      interior.floors.push(floorObj);
    }

    building.interior = interior;
    return interior;
  }

  _applyStateToInterior(interior, state) {
    if (state === 'POWER_FAILURE' || state === 'OVERRUN' || state === 'ABANDONED') {
      interior.setPower(false, true);
    } else if (state === 'NORMAL' || state === 'ACTIVE' || state === 'SAFEHOUSE') {
      interior.setPower(true, false);
    } else if (state === 'LOCKDOWN') {
      interior.setPower(true, true);
      interior.doors.forEach(d => { d.isLocked = true; });
    }

    if (state === 'DAMAGED' || state === 'OVERRUN') {
      interior.windows.forEach(w => { w.isBroken = true; });
    }
  }
}
