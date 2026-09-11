# FREEWORLD — ROAD NETWORK, TRAFFIC & VEHICLE SYSTEM SPECIFICATION

## 🏎️ OVERVIEW

The **Phase 4 System Architecture** delivers a realistic urban transportation foundation featuring:
1. **Authoritative Vehicle Tracking Registry (`VehicleRegistry.js`)** managing `vehicleId`, license plates, condition ($0 - 100\%$), fuel ($0 - 100\%$), district location, and occupants.
2. **Enhanced Vehicle Physics & Dynamics Engine** with Pacejka lateral slip curves, suspension pitch/roll weight transfer, mass-based momentum transfer ($p = m \cdot v$), ABS braking modulation, and speed-sensitive steering.
3. **Multi-Lane Traffic & Autonomous Navigation AI (`VehicleAI.js`)** featuring pure pursuit steering, lane changing AI, traffic light stop line compliance, and emergency vehicle siren yielding.
4. **4-Phase Traffic Light Controller (`TrafficSignals.js`)** supporting `GREEN`, `AMBER`, `RED`, `EMERGENCY_OVERRIDE`, and blackout fallback modes.

---

## 🚗 VEHICLE CLASSES & PHYSICAL SPECIFICATIONS

| Vehicle Model | Vehicle Class | Max Speed | Accel Rate | Mass (kg) | Steering Sensitivity | Special Features |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Apex GT-X** | Supercar | $52\text{ m/s}$ ($190\text{ km/h}$) | $36\text{ m/s}^2$ | $1,300\text{ kg}$ | 2.6 | Active rear carbon wing, high Pacejka slip grip. |
| **Vindicator V8** | Muscle Car | $46\text{ m/s}$ ($165\text{ km/h}$) | $32\text{ m/s}^2$ | $1,650\text{ kg}$ | 2.0 | High torque, rear-wheel drift oversteer, hood scoop. |
| **Kestrel Executive**| Sedan | $42\text{ m/s}$ ($150\text{ km/h}$) | $26\text{ m/s}^2$ | $1,550\text{ kg}$ | 2.2 | Balanced handling, standard civilian traffic car. |
| **Goliath 6x6** | Armored Truck | $34\text{ m/s}$ ($120\text{ km/h}$) | $20\text{ m/s}^2$ | $4,200\text{ kg}$ | 1.6 | 6-wheel drive, high kinetic momentum, heavy bullbar. |
| **Phantom Shadow** | Motorcycle | $56\text{ m/s}$ ($200\text{ km/h}$) | $44\text{ m/s}^2$ | $450\text{ kg}$ | 3.2 | Lean banking physics, high acceleration & agility. |
| **Police Interceptor**| Emergency Cruiser| $48\text{ m/s}$ ($175\text{ km/h}$) | $34\text{ m/s}^2$ | $1,600\text{ kg}$ | 2.4 | Dual red/blue strobe lightbar, siren priority yield. |

---

## 📋 AUTHORITATIVE TRACKING REGISTRY (`VehicleRegistry.js`)

Every vehicle instance in the game world is registered with global tracking parameters:

```json
{
  "vehicleId": "veh_9f3a12",
  "type": "car",
  "displayName": "Kestrel Executive",
  "plate": "FW-8492-CA",
  "condition": 100,
  "fuel": 88.5,
  "location": {
    "district": "Downtown Core",
    "position": { "x": 45.2, "y": 0.45, "z": -12.8 }
  },
  "occupantsCount": 1,
  "isEmergencyVehicle": false
}
```

- **Fuel Consumption**: Operating a vehicle depletes fuel at a rate proportional to vehicle speed ($\text{fuel} -= \Delta t \cdot 0.04 \cdot \frac{v}{12}$). Reaching $0\%$ fuel stalls the engine and limits speed to $0$.
- **License Plate Generator**: Generates realistic state license plates (`FW-XXXX-YY`).

---

## 🚥 TRAFFIC SIGNALS & EMERGENCY YIELDING

### Traffic Signal State Machine (`TrafficSignals.js`)
- `GREEN`: Allows traffic in designated direction to proceed.
- `AMBER`: Slows approaching traffic.
- `RED`: Commands vehicles to halt before the intersection stop line.
- `EMERGENCY_OVERRIDE`: Triggered when emergency sirens are active; overrides all signals to grant an open green corridor.
- `BLACKOUT`: Power loss triggers flashing amber caution mode.

### Emergency Vehicle Priority AI (`VehicleAI.js`)
When an emergency vehicle engages sirens:
1. Surrounding NPC vehicles detect the siren signal within $28\text{m}$.
2. `isYieldingToEmergency` activates, prompting vehicles to turn on hazard lights and steer towards the right shoulder to yield right of way.

---

## ⚡ LOD STREAMING & OPTIMIZATION

- `NEAR` ($<75\text{m}$): Full physics calculations, particle smoke, suspension pitch/roll, spotlight beams, wheel rotations.
- `MID` ($75-180\text{m}$): Simplified kinematic motion and low-poly geometry.
- `FAR` ($180-320\text{m}$): Waypoint interpolation without particle effects.
- `UNLOADED` ($>320\text{m}$): Position virtualization; culled from WebGL scene graph.

---

## 🧪 VERIFICATION

Run automated Phase 4 verification suite:
```bash
node tests/test_phase4_traffic_vehicles.js
```
- **21 / 21 Unit & Integration Tests Passed**:
  - License plate format validation & tracking attributes.
  - Physics speed, acceleration, mass, and fuel depletion assertions.
  - Traffic light state cycling & emergency priority overrides.
  - Emergency vehicle siren detection & NPC pull-over yielding.
  - Serialization & deserialization persistence.
