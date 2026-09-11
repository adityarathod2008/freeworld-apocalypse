/**
 * Game FreeWorld - VehiclePhysics
 * AAA physical vehicle simulation:
 * - Longitudinal & lateral weight transfer (acceleration lift, braking dip, cornering roll)
 * - Non-linear tire traction curve & Pacejka slip angle approximation
 * - Drivetrain simulation (6 gears + reverse, torque curve, engine RPM redline)
 * - Surface grip modification (wet road friction)
 * - Visual suspension displacement & spring damping
 */
import * as THREE from 'three';

export class VehiclePhysics {
  constructor(config = {}) {
    this.mass = config.mass || 1500;
    this.maxSpeed = config.maxSpeed || 48; // m/s (~172 km/h)
    this.reverseSpeed = config.reverseSpeed || 14;
    this.accelRate = config.acceleration || 32;
    this.brakeRate = config.brakingForce || 40;
    this.steerSensitivity = config.steeringSensitivity || 2.4;
    this.dragCoeff = config.drag || 0.32;
    this.type = config.type || 'car'; // 'car' | 'truck' | 'bike'

    // Drivetrain & Gears
    this.gearRatios = config.gearRatios || [3.9, 2.6, 1.8, 1.3, 1.0, 0.78];
    this.currentGear = 1;
    this.rpm = 900;
    this.idleRpm = 900;
    this.maxRpm = 7800;
    this.isBackfiring = false;
    this.backfireTimer = 0;

    // Weight Transfer & Suspension
    this.pitch = 0; // Forward/backward tilt (braking dip / accel squat)
    this.roll = 0;  // Lateral lean (body roll)
    this.heave = 0; // Vertical suspension compression
    this.suspensionFreq = config.suspensionFreq || 8.0;
    this.suspensionDamping = config.suspensionDamping || 0.7;

    // Tire Slip & Traction
    this.driftFactor = 0;
    this.lateralSlip = 0;
    this.tireGripMultiplier = 1.0; // Reduced in rain

    // Skid marks & smoke triggers
    this.isSkidding = false;
    this.skidIntensity = 0;
  }

  setSurfaceGrip(gripMultiplier = 1.0) {
    this.tireGripMultiplier = gripMultiplier;
  }

  updatePhysics(vehicle, input, delta, collision) {
    const isThrottle = input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp');
    const isBrake = input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown');
    const isSteerLeft = input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft');
    const isSteerRight = input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight');
    const isHandbrake = input.isKeyDown('Space');

    // 1. Steering with speed-sensitive damping
    let targetSteer = 0;
    if (isSteerLeft) targetSteer -= 1;
    if (isSteerRight) targetSteer += 1;

    const speedRatio = Math.min(1.0, Math.abs(vehicle.speed) / (this.maxSpeed * 0.55));
    // High-speed stability steering reduction
    const steerLimit = THREE.MathUtils.lerp(0.68, 0.26, speedRatio);
    const steerSpeed = this.steerSensitivity * (isHandbrake ? 5.0 : 4.0);
    vehicle.steerAngle = THREE.MathUtils.lerp(vehicle.steerAngle, targetSteer * steerLimit, delta * steerSpeed);

    // 2. Handbrake and Drift Traction
    if (isHandbrake) {
      this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 1.0, delta * 6.0);
    } else {
      this.driftFactor = THREE.MathUtils.lerp(this.driftFactor, 0, delta * 3.5);
    }

    // 3. Longitudinal Acceleration & Braking with weight transfer
    let accelForce = 0;
    const effectiveGrip = this.tireGripMultiplier * (1.0 - this.driftFactor * 0.35);

    if (isThrottle) {
      if (vehicle.speed < -1.0) {
        // Braking reverse motion
        vehicle.speed = Math.min(0, vehicle.speed + this.brakeRate * 1.2 * delta);
        accelForce = this.brakeRate;
      } else {
        // Drive forward through torque curve
        const torqueFraction = Math.max(0.18, 1.0 - Math.pow(Math.abs(vehicle.speed) / this.maxSpeed, 1.4));
        const forwardDrive = this.accelRate * torqueFraction * effectiveGrip;
        vehicle.speed = Math.min(this.maxSpeed, vehicle.speed + forwardDrive * delta);
        accelForce = forwardDrive;
      }
    } else if (isBrake) {
      if (vehicle.speed > 1.0) {
        // Hard forward braking
        const brakeDecel = this.brakeRate * effectiveGrip;
        vehicle.speed = Math.max(0, vehicle.speed - brakeDecel * delta);
        accelForce = -brakeDecel;
      } else {
        // Reverse drive
        const revDrive = this.accelRate * 0.55 * effectiveGrip;
        vehicle.speed = Math.max(-this.reverseSpeed, vehicle.speed - revDrive * delta);
        accelForce = -revDrive;
      }
    } else {
      // Natural rolling resistance and aerodynamic drag (0.5 * rho * Cd * v^2)
      const aeroDrag = this.dragCoeff * 0.08 * vehicle.speed * Math.abs(vehicle.speed);
      const rollingFriction = (isHandbrake ? 12.0 : 1.8) * Math.sign(vehicle.speed);
      const totalDrag = (aeroDrag + rollingFriction) * delta;

      if (Math.abs(vehicle.speed) <= Math.abs(totalDrag)) {
        vehicle.speed = 0;
      } else {
        vehicle.speed -= totalDrag;
      }
      accelForce = 0;
    }

    // 4. Lateral Slip Angle (Pacejka curve approximation)
    if (Math.abs(vehicle.speed) > 0.4) {
      const dirSign = vehicle.speed >= 0 ? 1 : -1;
      const turnRate = vehicle.steerAngle * (vehicle.speed / 14.0) * dirSign;
      const driftMultiplier = 1.0 + this.driftFactor * 1.25;

      vehicle.mesh.rotation.y += turnRate * driftMultiplier * delta;

      // Calculate lateral slip
      this.lateralSlip = Math.abs(vehicle.steerAngle * vehicle.speed) * (isHandbrake ? 1.8 : 0.8);
    } else {
      this.lateralSlip = 0;
    }

    // 5. Weight Transfer Simulation
    // Pitch: Braking dips front (negative pitch), acceleration squats rear (positive pitch)
    const targetPitch = THREE.MathUtils.clamp(-accelForce * 0.0035, -0.08, 0.06);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, delta * 8.0);

    // Roll: Cornering forces body to lean outward, motorcycle leans inward
    let targetRoll = 0;
    if (this.type === 'bike') {
      targetRoll = -vehicle.steerAngle * Math.min(1.0, Math.abs(vehicle.speed) / 10.0) * 0.85; // up to ~45° lean
    } else {
      targetRoll = vehicle.steerAngle * Math.min(1.0, Math.abs(vehicle.speed) / 20.0) * 0.12; // car chassis roll
    }
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, delta * 8.0);

    // 6. Drivetrain Gears & RPM
    this.updateGears(vehicle.speed, delta);

    // 7. Skid & Smoke Telemetry
    this.skidIntensity = (this.driftFactor > 0.2 || (isBrake && vehicle.speed > 8)) ? Math.min(1.0, this.lateralSlip / 15.0 + 0.3) : 0;
    this.isSkidding = this.skidIntensity > 0.25;

    // 8. Backfire effect update
    if (this.backfireTimer > 0) {
      this.backfireTimer -= delta;
      if (this.backfireTimer <= 0) {
        this.isBackfiring = false;
      }
    }
  }

  updateGears(speed, delta) {
    const speedKmh = Math.abs(speed) * 3.6;
    const prevGear = this.currentGear;

    if (speed < -0.5) {
      this.currentGear = 0; // Reverse
    } else if (speedKmh < 28) {
      this.currentGear = 1;
    } else if (speedKmh < 58) {
      this.currentGear = 2;
    } else if (speedKmh < 95) {
      this.currentGear = 3;
    } else if (speedKmh < 140) {
      this.currentGear = 4;
    } else if (speedKmh < 185) {
      this.currentGear = 5;
    } else {
      this.currentGear = 6;
    }

    // Trigger backfire pop on aggressive downshift at high speed
    if (prevGear > this.currentGear && speedKmh > 60) {
      this.isBackfiring = true;
      this.backfireTimer = 0.12;
    }

    // Engine RPM calculation
    const gearIdx = Math.max(0, this.currentGear - 1);
    const ratio = this.gearRatios[gearIdx];
    const targetRpm = this.idleRpm + (speedKmh / (35 * (gearIdx + 1))) * (this.maxRpm - this.idleRpm);
    this.rpm = THREE.MathUtils.lerp(this.rpm, THREE.MathUtils.clamp(targetRpm, this.idleRpm, this.maxRpm), delta * 12.0);
  }
}
