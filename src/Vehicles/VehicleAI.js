/**
 * Game FreeWorld - VehicleAI (v3.0)
 * Authoritative AI navigation brain featuring:
 * - Pure Pursuit Look-Ahead Steering (Look-Ahead distance scales with speed)
 * - Waypoint arrival & overshoot prevention (Never orbits backwards)
 * - Curvature-based corner anticipation & braking
 * - Continuous swept collision against buildings & obstacles
 * - Obstacle yielding (slows down behind cars ahead)
 * - Anti-Circle & Stuck Detection Recovery (Brake -> Reverse -> Realign -> Resume)
 */
import * as THREE from 'three';
import { collision, COLLISION_LAYERS } from '../Core/CollisionSystem.js';

export class VehicleAI {
  constructor(vehicle, navGraph, initialNode = null) {
    this.vehicle = vehicle;
    this.navGraph = navGraph;

    this.currentNode = initialNode;
    this.targetNode = initialNode ? this.pickNextNode(initialNode) : null;
    this.targetPos = new THREE.Vector3();

    this.mode = 'CRUISE'; // 'CRUISE' | 'PURSUIT' | 'STUCK_RECOVERY'
    this.cruiseSpeed = 16 + Math.random() * 6; // 60-80 km/h
    this.pursuitSpeed = 38; // 135 km/h

    // Anti-Circle & Stuck Recovery
    this.stuckTimer = 0;
    this.recoveryTimer = 0;
    this.recoveryPhase = 0; // 0: Brake, 1: Reverse, 2: Realign
    this.recoverySteerSign = 1;

    // Obstacle avoidance
    this.isYielding = false;
  }

  setPursuitTarget(pos) {
    this.targetPos.copy(pos);
    this.mode = 'PURSUIT';
  }

  setCruiseMode() {
    this.mode = 'CRUISE';
  }

  pickNextNode(node) {
    if (!node || !node.connections || node.connections.length === 0) {
      return null;
    }
    // Random branch at intersections
    const idx = Math.floor(Math.random() * node.connections.length);
    return node.connections[idx];
  }

  update(delta, playerPos = null, otherVehicles = []) {
    if (!this.vehicle || !this.vehicle.mesh) return;

    // 1. Stuck Detection & Recovery FSM
    if (this.mode === 'STUCK_RECOVERY') {
      this.updateStuckRecovery(delta);
      return;
    }

    const pos = this.vehicle.mesh.position;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.vehicle.mesh.rotation.y);

    // Check if stuck (trying to drive but blocked for > 1.8s)
    if (Math.abs(this.vehicle.speed) < 1.0 && !this.isYielding) {
      this.stuckTimer += delta;
      if (this.stuckTimer > 1.8) {
        this.triggerStuckRecovery();
        return;
      }
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - delta * 0.5);
    }

    // 2. Determine Look-Ahead Waypoint
    let lookAheadPoint = null;
    let targetSpeedGoal = this.cruiseSpeed;

    if (this.mode === 'PURSUIT') {
      // Direct pursuit of target with road-aware lookahead
      const toTarget = new THREE.Vector3().subVectors(this.targetPos, pos);
      toTarget.y = 0;
      const dist = toTarget.length();
      lookAheadPoint = this.targetPos.clone();
      targetSpeedGoal = dist > 14 ? this.pursuitSpeed : 18;
    } else {
      // Autonomous Road Navigation via Pure Pursuit
      if (!this.currentNode) {
        this.currentNode = this.navGraph.getNearestRoadNode(pos, forward);
        this.targetNode = this.pickNextNode(this.currentNode);
      }

      if (!this.targetNode) {
        this.targetNode = this.navGraph.getNearestRoadNode(pos, forward);
        if (!this.targetNode) return;
      }

      // Check arrival at target node:
      // A node is reached if vehicle is within arrival radius OR has passed the node plane
      const toTargetNode = new THREE.Vector3().subVectors(this.targetNode.position, pos);
      toTargetNode.y = 0;
      const distToNode = toTargetNode.length();
      const dotForward = forward.dot(toTargetNode.clone().normalize());

      // Overshoot prevention: if node is behind vehicle (dotForward < 0) and close (< 8m), advance!
      if (distToNode < 5.0 || (distToNode < 8.0 && dotForward < 0.1)) {
        this.currentNode = this.targetNode;
        this.targetNode = this.pickNextNode(this.currentNode);
        if (!this.targetNode) {
          this.targetNode = this.navGraph.getNearestRoadNode(pos, forward);
        }
      }

      if (!this.targetNode) return;

      // Pure pursuit look-ahead distance: 8m to 24m based on speed
      const lookAheadDist = THREE.MathUtils.clamp(7.0 + Math.abs(this.vehicle.speed) * 0.65, 7.0, 24.0);
      const toNext = new THREE.Vector3().subVectors(this.targetNode.position, pos);
      toNext.y = 0;

      if (toNext.length() < lookAheadDist && this.targetNode.connections.length > 0) {
        // Look ahead to the subsequent waypoint along the route
        const nextNext = this.targetNode.connections[0];
        lookAheadPoint = nextNext.position.clone();
      } else {
        lookAheadPoint = this.targetNode.position.clone();
      }

      // Corner anticipation & braking
      if (this.targetNode.isIntersection) {
        targetSpeedGoal = Math.min(this.cruiseSpeed, 9.5); // Slow down through intersection turns
      } else {
        targetSpeedGoal = this.cruiseSpeed;
      }
    }

    // 3. Obstacle Avoidance, Traffic Light Stop Lines & Emergency Vehicle Yielding
    this.isYielding = false;
    this.isYieldingToEmergency = false;
    const forwardRayLen = Math.max(9.0, this.vehicle.speed * 0.7);

    // Yield to approaching Emergency Vehicles with Sirens
    if (otherVehicles) {
      for (const other of otherVehicles) {
        if (other === this || other === this.vehicle) continue;
        const otherIsEmergency = other.isEmergencyVehicle || other.vehicle?.displayName?.toLowerCase().includes('police') || other.displayName?.toLowerCase().includes('police');
        if (otherIsEmergency) {
          const otherPos = other.position || (other.mesh ? other.mesh.position : null);
          if (otherPos && pos.distanceTo(otherPos) < 28.0) {
            this.isYieldingToEmergency = true;
            this.isYielding = true;
            targetSpeedGoal = 0;
            // Pull over slightly to the right
            this.vehicle.steerAngle = 0.25;
            break;
          }
        }
      }
    }

    // Yield to player car if directly in front
    if (!this.isYieldingToEmergency && playerPos) {
      const toPlayer = new THREE.Vector3().subVectors(playerPos, pos);
      toPlayer.y = 0;
      const playerDist = toPlayer.length();
      if (playerDist < forwardRayLen) {
        const toPlayerNorm = toPlayer.clone().normalize();
        if (forward.dot(toPlayerNorm) > 0.65) {
          this.isYielding = true;
          targetSpeedGoal = 0;
        }
      }
    }

    // Yield to cars ahead in traffic or attempt lane change
    if (!this.isYielding && otherVehicles) {
      for (const other of otherVehicles) {
        if (other === this || other === this.vehicle) continue;
        const otherPos = other.position || (other.mesh ? other.mesh.position : null);
        if (!otherPos) continue;

        const toOther = new THREE.Vector3().subVectors(otherPos, pos);
        toOther.y = 0;
        const d = toOther.length();

        if (d < forwardRayLen) {
          const toOtherNorm = toOther.clone().normalize();
          if (forward.dot(toOtherNorm) > 0.7) {
            this.isYielding = true;
            targetSpeedGoal = 0;

            // Attempt Lane Change if slow traffic ahead
            if (this.targetNode && this.targetNode.connections.length > 1) {
              const altNode = this.targetNode.connections[1];
              if (altNode && altNode !== this.targetNode) {
                this.targetNode = altNode;
              }
            }
            break;
          }
        }
      }
    }

    // 4. Pure Pursuit Steering Calculation
    const toLook = new THREE.Vector3().subVectors(lookAheadPoint, pos);
    toLook.y = 0;
    const lookDist = toLook.length();

    if (lookDist > 0.1) {
      toLook.normalize();
      const angle = forward.angleTo(toLook);
      const cross = forward.clone().cross(toLook);
      const steerDir = cross.y > 0 ? 1 : -1;

      // Speed-dependent steering clamp (tight at low speeds, stable at high speeds)
      const maxSteer = Math.max(0.28, 0.6 - (Math.abs(this.vehicle.speed) / 50) * 0.25);
      const targetSteer = THREE.MathUtils.clamp(angle * steerDir * 1.5, -maxSteer, maxSteer);

      // Smooth steering response
      this.vehicle.steerAngle = THREE.MathUtils.lerp(this.vehicle.steerAngle, targetSteer, delta * 6.5);
      this.vehicle.mesh.rotation.y += this.vehicle.steerAngle * delta * (Math.abs(this.vehicle.speed) > 1 ? 2.6 : 1.2);
    }

    // 5. Throttle & Braking
    const accelRate = this.isYielding ? 6.0 : 3.0;
    this.vehicle.speed = THREE.MathUtils.lerp(this.vehicle.speed, targetSpeedGoal, delta * accelRate);

    // 6. Swept Box Movement with Collision Resolution
    const moveStep = forward.clone().multiplyScalar(this.vehicle.speed * delta);
    const nextPos = pos.clone().add(moveStep);

    const halfExtents = this.vehicle.halfExtents || new THREE.Vector3(1.2, 0.8, 2.3);
    const sweep = collision.sweptBoxTest(
      pos,
      nextPos,
      halfExtents,
      COLLISION_LAYERS.BUILDING | COLLISION_LAYERS.WORLD,
      this.vehicle
    );

    if (sweep.hasHit) {
      pos.copy(sweep.hitPoint).addScaledVector(sweep.normal, 0.08);
      this.vehicle.speed = -this.vehicle.speed * 0.2; // Bounce back
      this.triggerStuckRecovery();
    } else {
      pos.copy(nextPos);
    }

    pos.y = 0.45;

    // Update wheels rotation
    const wheelRotDelta = (this.vehicle.speed / 0.4) * delta;
    for (const w of this.vehicle.wheels) {
      w.rotation.x += wheelRotDelta;
    }
    for (const fw of this.vehicle.frontWheels) {
      fw.rotation.y = this.vehicle.steerAngle;
    }
  }

  triggerStuckRecovery() {
    this.mode = 'STUCK_RECOVERY';
    this.recoveryTimer = 0;
    this.recoveryPhase = 0; // Start with stop brake
    this.recoverySteerSign = Math.random() > 0.5 ? 1 : -1;
  }

  updateStuckRecovery(delta) {
    this.recoveryTimer += delta;
    const pos = this.vehicle.mesh.position;
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.vehicle.mesh.rotation.y);

    if (this.recoveryPhase === 0) {
      // Phase 0: Brake to full stop (0.35s)
      this.vehicle.speed = THREE.MathUtils.lerp(this.vehicle.speed, 0, delta * 8.0);
      if (this.recoveryTimer > 0.35) {
        this.recoveryPhase = 1;
        this.recoveryTimer = 0;
      }
    } else if (this.recoveryPhase === 1) {
      // Phase 1: Reverse with counter-steer (1.5s)
      this.vehicle.speed = THREE.MathUtils.lerp(this.vehicle.speed, -6.5, delta * 3.0);
      this.vehicle.steerAngle = this.recoverySteerSign * 0.5;
      this.vehicle.mesh.rotation.y += this.vehicle.steerAngle * delta * 1.5;

      const backStep = forward.clone().multiplyScalar(this.vehicle.speed * delta);
      pos.add(backStep);
      pos.y = 0.45;

      if (this.recoveryTimer > 1.5) {
        this.recoveryPhase = 2;
        this.recoveryTimer = 0;
      }
    } else if (this.recoveryPhase === 2) {
      // Phase 2: Re-align to nearest forward road lane node
      this.vehicle.speed = THREE.MathUtils.lerp(this.vehicle.speed, 0, delta * 6.0);
      this.currentNode = this.navGraph.getNearestRoadNode(pos, forward);
      this.targetNode = this.pickNextNode(this.currentNode);
      this.stuckTimer = 0;
      this.mode = 'CRUISE';
    }
  }
}
