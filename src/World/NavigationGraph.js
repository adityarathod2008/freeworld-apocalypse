/**
 * Game FreeWorld - NavigationGraph (v3.0)
 * Structured, directional waypoint networks for traffic lanes and pedestrian sidewalks.
 * Includes subdivision waypoints, directional tangents, smooth curved intersection arcs,
 * and zero 180° kinks to prevent vehicle orbiting/circling bugs.
 */
import * as THREE from 'three';

export class NavigationGraph {
  constructor() {
    this.roadNodes = [];
    this.sidewalkNodes = [];
  }

  init(districtSize = 360, blockCount = 4) {
    this.roadNodes = [];
    this.sidewalkNodes = [];

    const half = districtSize / 2;
    const step = districtSize / blockCount;
    const roadWidth = 14;
    const laneOffset = 3.5;
    const stopDistance = roadWidth / 2 + 1.0; // Distance before intersection center where lane stops

    // Helper: Add road node with directional metadata
    const addRoad = (x, z, dirX = 0, dirZ = 0, isInter = false) => {
      const node = {
        id: this.roadNodes.length,
        position: new THREE.Vector3(x, 0.1, z),
        direction: new THREE.Vector3(dirX, 0, dirZ).normalize(),
        connections: [],
        isIntersection: isInter,
        speedLimit: isInter ? 10 : 18
      };
      this.roadNodes.push(node);
      return node;
    };

    const connect = (fromNode, toNode) => {
      if (!fromNode.connections.includes(toNode)) {
        fromNode.connections.push(toNode);
      }
    };

    // Store entry and exit points for each intersection (i, j)
    // entry[i][j][dir]: node arriving at intersection (i, j) from direction
    // exit[i][j][dir]: node leaving intersection (i, j) in direction
    const entry = {};
    const exit = {};

    const key = (i, j) => `${i}_${j}`;

    for (let i = 0; i <= blockCount; i++) {
      for (let j = 0; j <= blockCount; j++) {
        const k = key(i, j);
        entry[k] = {};
        exit[k] = {};
      }
    }

    // 1. Generate Straight Lane Segments with Subdivided Waypoints
    // Points per block segment: 4 intermediate waypoints for smooth tracking
    const subsPerBlock = 4;

    // Horizontal road segments (East-West)
    for (let j = 0; j <= blockCount; j++) {
      const roadZ = -half + j * step;
      for (let i = 0; i < blockCount; i++) {
        const startX = -half + i * step;
        const endX = -half + (i + 1) * step;

        const kCurr = key(i, j);
        const kNext = key(i + 1, j);

        // --- Eastbound Lane (moving towards +X at roadZ + laneOffset) ---
        const ebStartX = startX + stopDistance;
        const ebEndX = endX - stopDistance;
        let prevNodeEB = addRoad(ebStartX, roadZ + laneOffset, 1, 0);
        exit[kCurr]['E'] = prevNodeEB;

        for (let s = 1; s <= subsPerBlock; s++) {
          const t = s / subsPerBlock;
          const x = ebStartX + (ebEndX - ebStartX) * t;
          const currNode = addRoad(x, roadZ + laneOffset, 1, 0);
          connect(prevNodeEB, currNode);
          prevNodeEB = currNode;
        }
        entry[kNext]['E'] = prevNodeEB; // Arrives at intersection (i+1, j) heading East

        // --- Westbound Lane (moving towards -X at roadZ - laneOffset) ---
        const wbStartX = endX - stopDistance;
        const wbEndX = startX + stopDistance;
        let prevNodeWB = addRoad(wbStartX, roadZ - laneOffset, -1, 0);
        exit[kNext]['W'] = prevNodeWB;

        for (let s = 1; s <= subsPerBlock; s++) {
          const t = s / subsPerBlock;
          const x = wbStartX + (wbEndX - wbStartX) * t;
          const currNode = addRoad(x, roadZ - laneOffset, -1, 0);
          connect(prevNodeWB, currNode);
          prevNodeWB = currNode;
        }
        entry[kCurr]['W'] = prevNodeWB; // Arrives at intersection (i, j) heading West
      }
    }

    // Vertical road segments (North-South)
    for (let i = 0; i <= blockCount; i++) {
      const roadX = -half + i * step;
      for (let j = 0; j < blockCount; j++) {
        const startZ = -half + j * step;
        const endZ = -half + (j + 1) * step;

        const kCurr = key(i, j);
        const kNext = key(i, j + 1);

        // --- Southbound Lane (moving towards +Z at roadX + laneOffset) ---
        const sbStartZ = startZ + stopDistance;
        const sbEndZ = endZ - stopDistance;
        let prevNodeSB = addRoad(roadX + laneOffset, sbStartZ, 0, 1);
        exit[kCurr]['S'] = prevNodeSB;

        for (let s = 1; s <= subsPerBlock; s++) {
          const t = s / subsPerBlock;
          const z = sbStartZ + (sbEndZ - sbStartZ) * t;
          const currNode = addRoad(roadX + laneOffset, z, 0, 1);
          connect(prevNodeSB, currNode);
          prevNodeSB = currNode;
        }
        entry[kNext]['S'] = prevNodeSB; // Arrives at intersection (i, j+1) heading South

        // --- Northbound Lane (moving towards -Z at roadX - laneOffset) ---
        const nbStartZ = endZ - stopDistance;
        const nbEndZ = startZ + stopDistance;
        let prevNodeNB = addRoad(roadX - laneOffset, nbStartZ, 0, -1);
        exit[kNext]['N'] = prevNodeNB;

        for (let s = 1; s <= subsPerBlock; s++) {
          const t = s / subsPerBlock;
          const z = nbStartZ + (nbEndZ - nbStartZ) * t;
          const currNode = addRoad(roadX - laneOffset, z, 0, -1);
          connect(prevNodeNB, currNode);
          prevNodeNB = currNode;
        }
        entry[kCurr]['N'] = prevNodeNB; // Arrives at intersection (i, j) heading North
      }
    }

    // 2. Connect Intersections with Curved Arc Turns & Straight Transitions
    // Helper: Build a smooth 2-point quadratic Bezier arc across an intersection
    const addCurve = (fromNode, toNode, cornerControl) => {
      const arc1 = addRoad(
        (fromNode.position.x * 0.5 + cornerControl.x * 0.5),
        (fromNode.position.z * 0.5 + cornerControl.z * 0.5),
        toNode.position.x - fromNode.position.x,
        toNode.position.z - fromNode.position.z,
        true
      );
      const arc2 = addRoad(
        (cornerControl.x * 0.5 + toNode.position.x * 0.5),
        (cornerControl.z * 0.5 + toNode.position.z * 0.5),
        toNode.position.x - fromNode.position.x,
        toNode.position.z - fromNode.position.z,
        true
      );
      connect(fromNode, arc1);
      connect(arc1, arc2);
      connect(arc2, toNode);
    };

    for (let i = 0; i <= blockCount; i++) {
      for (let j = 0; j <= blockCount; j++) {
        const k = key(i, j);
        const center = new THREE.Vector3(-half + i * step, 0.1, -half + j * step);
        const entries = entry[k];
        const exits = exit[k];

        // --- Arriving from West (Heading East, 'E') ---
        if (entries['E']) {
          const from = entries['E'];
          // 1. Straight (Continue East)
          if (exits['E']) {
            connect(from, exits['E']);
          }
          // 2. Right Turn (Turn South)
          if (exits['S']) {
            addCurve(from, exits['S'], new THREE.Vector3(center.x + laneOffset, 0.1, center.z + laneOffset));
          }
          // 3. Left Turn (Turn North)
          if (exits['N']) {
            addCurve(from, exits['N'], new THREE.Vector3(center.x - laneOffset, 0.1, center.z + laneOffset));
          }
          // If at eastern border with no straight or left, loop cleanly into South
          if (!exits['E'] && !exits['N'] && exits['S']) {
            addCurve(from, exits['S'], new THREE.Vector3(center.x + laneOffset, 0.1, center.z + laneOffset));
          }
        }

        // --- Arriving from East (Heading West, 'W') ---
        if (entries['W']) {
          const from = entries['W'];
          // 1. Straight (Continue West)
          if (exits['W']) {
            connect(from, exits['W']);
          }
          // 2. Right Turn (Turn North)
          if (exits['N']) {
            addCurve(from, exits['N'], new THREE.Vector3(center.x - laneOffset, 0.1, center.z - laneOffset));
          }
          // 3. Left Turn (Turn South)
          if (exits['S']) {
            addCurve(from, exits['S'], new THREE.Vector3(center.x + laneOffset, 0.1, center.z - laneOffset));
          }
          // If at western border, loop cleanly into North
          if (!exits['W'] && !exits['S'] && exits['N']) {
            addCurve(from, exits['N'], new THREE.Vector3(center.x - laneOffset, 0.1, center.z - laneOffset));
          }
        }

        // --- Arriving from North (Heading South, 'S') ---
        if (entries['S']) {
          const from = entries['S'];
          // 1. Straight (Continue South)
          if (exits['S']) {
            connect(from, exits['S']);
          }
          // 2. Right Turn (Turn West)
          if (exits['W']) {
            addCurve(from, exits['W'], new THREE.Vector3(center.x + laneOffset, 0.1, center.z - laneOffset));
          }
          // 3. Left Turn (Turn East)
          if (exits['E']) {
            addCurve(from, exits['E'], new THREE.Vector3(center.x + laneOffset, 0.1, center.z + laneOffset));
          }
          // If at southern border, loop cleanly into West
          if (!exits['S'] && !exits['E'] && exits['W']) {
            addCurve(from, exits['W'], new THREE.Vector3(center.x + laneOffset, 0.1, center.z - laneOffset));
          }
        }

        // --- Arriving from South (Heading North, 'N') ---
        if (entries['N']) {
          const from = entries['N'];
          // 1. Straight (Continue North)
          if (exits['N']) {
            connect(from, exits['N']);
          }
          // 2. Right Turn (Turn East)
          if (exits['E']) {
            addCurve(from, exits['E'], new THREE.Vector3(center.x - laneOffset, 0.1, center.z + laneOffset));
          }
          // 3. Left Turn (Turn West)
          if (exits['W']) {
            addCurve(from, exits['W'], new THREE.Vector3(center.x - laneOffset, 0.1, center.z - laneOffset));
          }
          // If at northern border, loop cleanly into East
          if (!exits['N'] && !exits['W'] && exits['E']) {
            addCurve(from, exits['E'], new THREE.Vector3(center.x - laneOffset, 0.1, center.z + laneOffset));
          }
        }
      }
    }

    // 3. Sidewalk Navigation Graph for Pedestrians
    for (let i = 0; i < blockCount; i++) {
      for (let j = 0; j < blockCount; j++) {
        const x1 = -half + i * step + roadWidth / 2 + 3;
        const x2 = -half + (i + 1) * step - roadWidth / 2 - 3;
        const z1 = -half + j * step + roadWidth / 2 + 3;
        const z2 = -half + (j + 1) * step - roadWidth / 2 - 3;

        const sw1 = this.addSidewalkNode(x1, z1);
        const sw2 = this.addSidewalkNode(x2, z1);
        const sw3 = this.addSidewalkNode(x2, z2);
        const sw4 = this.addSidewalkNode(x1, z2);

        this.connectSidewalkNodes(sw1, sw2);
        this.connectSidewalkNodes(sw2, sw3);
        this.connectSidewalkNodes(sw3, sw4);
        this.connectSidewalkNodes(sw4, sw1);

        this.connectSidewalkNodes(sw2, sw1);
        this.connectSidewalkNodes(sw3, sw2);
        this.connectSidewalkNodes(sw4, sw3);
        this.connectSidewalkNodes(sw1, sw4);
      }
    }
  }

  addSidewalkNode(x, z) {
    const node = {
      id: this.sidewalkNodes.length,
      position: new THREE.Vector3(x, 0.35, z),
      connections: []
    };
    this.sidewalkNodes.push(node);
    return node;
  }

  connectSidewalkNodes(fromNode, toNode) {
    if (!fromNode.connections.includes(toNode)) {
      fromNode.connections.push(toNode);
    }
  }

  getNearestRoadNode(position, forwardHeading = null) {
    let nearest = null;
    let minDistSq = Infinity;

    for (const node of this.roadNodes) {
      // If a heading is supplied, prefer nodes aligned with heading
      if (forwardHeading && node.direction) {
        const dot = forwardHeading.dot(node.direction);
        if (dot < 0) continue; // Skip nodes facing opposing direction
      }

      const dSq = node.position.distanceToSquared(position);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = node;
      }
    }

    // Fallback if no aligned node found
    if (!nearest && forwardHeading) {
      return this.getNearestRoadNode(position, null);
    }
    return nearest;
  }

  getNearestSidewalkNode(position) {
    let nearest = null;
    let minDistSq = Infinity;
    for (const node of this.sidewalkNodes) {
      const dSq = node.position.distanceToSquared(position);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearest = node;
      }
    }
    return nearest;
  }
}
