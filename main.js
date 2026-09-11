/**
 * Game FreeWorld — Master Application Bootstrap
 * Connects all modular subsystems into a unified living AAA open-world vertical slice
 */
import * as THREE from 'three';
import { Engine } from './src/Core/Engine.js';
import { GameState } from './src/Core/GameState.js';
import { EntityManager } from './src/Core/EntityManager.js';
import { PerformanceManager } from './src/Core/PerformanceManager.js';
import { InputManager } from './src/Core/InputManager.js';
import { events } from './src/Core/EventBus.js';
import { collision, COLLISION_LAYERS } from './src/Core/CollisionSystem.js';

import { NavigationGraph } from './src/World/NavigationGraph.js';
import { CityBuilder } from './src/World/CityBuilder.js';
import { DistrictManager } from './src/World/DistrictManager.js';
import { PropSystem } from './src/World/PropSystem.js';
import { WorldSimulation } from './src/World/WorldSimulation.js';
import { SectorManager } from './src/World/SectorManager.js';
import { LODManager } from './src/World/LODManager.js';

import { CameraController } from './src/Player/CameraController.js';
import { PlayerController } from './src/Player/PlayerController.js';
import { InteractionSystem } from './src/Player/InteractionSystem.js';

import { VehicleManager } from './src/Vehicles/VehicleManager.js';
import { NPCManager } from './src/NPC/NPCManager.js';
import { TrafficManager } from './src/Traffic/TrafficManager.js';
import { TrafficSignals } from './src/Traffic/TrafficSignals.js';

import { WantedSystem } from './src/Police/WantedSystem.js';
import { PoliceManager } from './src/Police/PoliceManager.js';
import { WitnessSystem } from './src/Police/WitnessSystem.js';
import { PoliceDispatch } from './src/Police/PoliceDispatch.js';
import { EvidenceSystem, evidenceSystem } from './src/Police/EvidenceSystem.js';
import { ArrestSystem } from './src/Police/ArrestSystem.js';
import { EmergencyServices } from './src/WorldSystems/EmergencyServices.js';

import { WeaponSystem } from './src/Combat/WeaponSystem.js';
import { ProjectileManager } from './src/Combat/ProjectileManager.js';
import { HitReaction } from './src/Combat/HitReaction.js';
import { WeaponWheel } from './src/Combat/WeaponWheel.js';

import { MissionManager } from './src/Missions/MissionManager.js';
import { MainMission1 } from './src/Missions/MainMission1.js';
import { RandomEvents } from './src/Missions/RandomEvents.js';
import { StreetRaceActivity, CourierBountyActivity } from './src/Missions/SideActivities.js';

import { EconomyManager } from './src/WorldSystems/EconomyManager.js';
import { ShopSystem } from './src/Economy/ShopSystem.js';
import { SaveManager } from './src/SaveSystem/SaveManager.js';

import { TimeManager } from './src/Weather/TimeManager.js';
import { WeatherManager } from './src/Weather/WeatherManager.js';
import { EnvironmentEffects } from './src/Weather/EnvironmentEffects.js';

import { SoundEngine } from './src/Audio/SoundEngine.js';
import { RadioSystem } from './src/Audio/RadioSystem.js';

import { UIManager } from './src/UI/UIManager.js';
import { HUD } from './src/UI/HUD.js';
import { NotificationSystem } from './src/UI/NotificationSystem.js';
import { Minimap } from './src/UI/Minimap.js';
import { MapMenu } from './src/UI/MapMenu.js';
import { Smartphone } from './src/UI/Smartphone.js';

import { DebugConsole } from './src/Tools/DebugConsole.js';
import { PerformanceStats } from './src/Tools/PerformanceStats.js';

class GameApp {
  constructor() {
    console.log('[GameFreeWorld] Bootstrapping AAA Open-World Architecture...');

    // 1. Core Engine, GameState & Input
    this.engine = new Engine('canvas-container');
    this.gameState = GameState.get();
    this.entityManager = EntityManager.get();
    this.performanceManager = new PerformanceManager(this.engine);
    this.input = new InputManager(this.engine.renderer.domElement);

    // 2. Navigation Graph
    this.navGraph = new NavigationGraph();
    this.navGraph.init(360, 4);

    // 3. City District, Props, Sector Streaming & Districts
    this.districtManager = new DistrictManager();
    this.worldSimulation = new WorldSimulation();
    this.sectorManager = new SectorManager(60, 16);
    this.cityBuilder = new CityBuilder(this.engine.scene);
    this.cityData = this.cityBuilder.build();

    this.propSystem = new PropSystem(this.engine.scene);
    this.propData = this.propSystem.buildProps(this.cityData);

    // Merge and register into authoritative CollisionSystem
    this.allColliders = [...this.cityData.colliders, ...this.propData.colliders];
    for (const c of this.allColliders) {
      const layer = c.type === 'building' ? COLLISION_LAYERS.BUILDING : COLLISION_LAYERS.WORLD;
      collision.registerCollider({
        box: c.box,
        layer,
        type: 'static',
        userData: { tag: c.type }
      });
    }

    // 4. Player, Camera & Contextual Interaction
    this.cameraCtrl = new CameraController(this.engine.camera, this.engine.renderer.domElement);
    this.player = new PlayerController(this.engine.scene, this.input, this.cameraCtrl);
    this.interactionSystem = new InteractionSystem();
    this.entityManager.registerPlayer(this.player);

    // 5. Vehicles
    this.vehicleManager = new VehicleManager(this.engine.scene);
    this.vehicleManager.spawnInitialVehicles(this.cityData.landmarks);
    for (const v of this.vehicleManager.getVehicles()) {
      this.entityManager.registerVehicle(v);
      this.sectorManager.registerEntity(v);
    }

    // 6. Pedestrians & Traffic
    this.npcManager = new NPCManager(this.engine.scene, this.navGraph);
    this.npcManager.spawnCivilians(32);
    for (const p of this.npcManager.getPedestrians()) {
      this.entityManager.registerPedestrian(p);
      this.sectorManager.registerEntity(p);
    }

    this.trafficManager = new TrafficManager(this.engine.scene, this.navGraph);
    this.trafficManager.spawnTraffic(14);
    for (const tc of this.trafficManager.getTrafficCars()) {
      this.entityManager.registerTraffic(tc);
      this.sectorManager.registerEntity(tc);
    }

    this.trafficSignals = new TrafficSignals();

    // 7. Police, Evidence, Arrest & Emergency Ecosystem
    this.wantedSystem = new WantedSystem();
    this.policeManager = new PoliceManager(this.engine.scene, this.navGraph);
    this.witnessSystem = new WitnessSystem();
    this.policeDispatch = new PoliceDispatch();
    this.evidenceSystem = evidenceSystem;
    this.arrestSystem = new ArrestSystem();
    this.emergencyServices = new EmergencyServices(this.engine.scene, this.navGraph);

    // 8. Combat & Weapons
    this.weaponSystem = new WeaponSystem(this.engine.scene, this.engine.camera);
    this.projectileManager = new ProjectileManager(this.engine.scene);
    this.hitReaction = new HitReaction(this.engine.scene);
    this.weaponWheel = new WeaponWheel(this.input);

    // 9. Economy, Shops, Real Estate & Persistence
    this.economy = new EconomyManager(15400, 45000);
    this.shops = new ShopSystem(this.economy);
    this.saveManager = new SaveManager(this.economy);
    this.saveManager.load();

    // 10. Time, Weather, Atmosphere & Audio
    this.timeManager = new TimeManager(this.engine.scene);
    this.weatherManager = new WeatherManager(this.engine.scene);
    this.environmentEffects = new EnvironmentEffects(this.engine.scene);

    this.soundEngine = new SoundEngine();
    this.radioSystem = new RadioSystem(this.soundEngine);

    // 11. Missions & Systemic Events
    this.missionManager = new MissionManager(this.engine.scene);
    this.mainMission = new MainMission1(this.cityData.landmarks);
    this.missionManager.startMission(this.mainMission);
    this.randomEvents = new RandomEvents(this.economy);

    // 12. UI, Minimap, Fullscreen Map, Phone & Telemetry
    this.ui = new UIManager();
    this.hud = new HUD();
    this.notificationSystem = new NotificationSystem();
    this.minimap = new Minimap('minimap-canvas', this.navGraph);
    this.mapMenu = new MapMenu(this.navGraph, this.cityData.landmarks);
    this.smartphone = new Smartphone(this.economy, () => this.player.position);
    this.debugConsole = new DebugConsole(this.cityData.landmarks);
    this.performanceStats = new PerformanceStats();

    this.bindMissionEvents();

    // Register Main Game Loop
    this.engine.registerUpdatable(this);

    // Start Engine
    this.engine.start();

    // Welcome Announcement
    events.emit('SHOW_SUBTITLE', {
      speaker: 'RADIO HOST',
      text: 'Good morning, Bay City! Skies are clear over Downtown. Drive safe and obey all speed limits.'
    });

    console.log('[GameFreeWorld] Master application loop running smoothly.');
  }

  bindMissionEvents() {
    events.on('PLAYER_ENTERED_VEHICLE', () => {
      this.mainMission.onPlayerEnterCar();
    });

    events.on('TRIGGER_ACTIVATED', (trigger) => {
      if (trigger.id === 'safehouse') {
        this.player.health = 100;
        this.player.armor = 100;
        events.emit('HUD_NOTIFICATION', {
          title: 'SAFEHOUSE REST',
          message: 'Health & Armor restored. Game saved.'
        });
        this.saveManager.save(this.player, this.weaponSystem, this.wantedSystem, this.timeManager);
      } else if (trigger.id === 'armory') {
        events.emit('OPEN_SHOP', 'armory');
      } else if (trigger.id === 'atm') {
        // ATM quick banking interaction
        events.emit('OPEN_SHOP', 'atm');
      }
    });

    events.on('RESTORE_ARMOR', () => {
      this.player.armor = 100;
    });

    events.on('RESTORE_HEALTH', () => {
      this.player.health = 100;
    });

    events.on('PLAYER_TAKE_DAMAGE', (amount) => {
      this.player.takeDamage(amount);
    });

    events.on('CRIME_COMMITTED', ({ type, position }) => {
      this.witnessSystem.evaluateCrime(type, position || this.player.position, this.npcManager.getPedestrians());
    });

    events.on('TRIGGER_START_MAIN_MISSION', () => {
      this.mainMission = new MainMission1(this.cityData.landmarks);
      this.missionManager.startMission(this.mainMission);
    });

    events.on('TRIGGER_START_RACE', () => {
      const race = new StreetRaceActivity(this.cityData.landmarks);
      this.missionManager.startMission(race);
    });

    events.on('TRIGGER_START_COURIER', () => {
      const courier = new CourierBountyActivity(this.cityData.landmarks);
      this.missionManager.startMission(courier);
    });

    // Cycle Radio Station with 'R' key when in vehicle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' && this.player.currentVehicle) {
        events.emit('CYCLE_RADIO');
      }
    });
  }

  update(delta) {
    // 1. Mouse Look Input
    const mouseDelta = this.input.getAndResetMouseDelta();
    this.cameraCtrl.handleMouseDelta(mouseDelta);

    const isDriving = !!this.player.currentVehicle;
    const isAiming = this.input.isAiming();
    this.ui.setAiming(isAiming);

    // 2. Player Locomotion & Physics
    this.player.update(delta, this.allColliders, this.vehicleManager.getVehicles(), this.propData.triggers);

    // Contextual interaction prompt
    this.interactionSystem.update(
      delta,
      this.player.position,
      isDriving,
      this.vehicleManager.getVehicles(),
      this.propData.triggers
    );
    this.interactionSystem.handleInteract(this.input, this.player);

    // 3. Camera Spring-Arm & Sector Partitioning
    this.cameraCtrl.update(delta, this.player.position, isAiming, this.allColliders);
    this.sectorManager.update(this.player.position);

    // 4. Vehicles
    this.vehicleManager.update(delta, this.input, this.allColliders);

    // 5. Traffic, Traffic Signals & Civilians
    this.trafficSignals.update(delta);
    this.trafficManager.update(delta, this.player.position);
    this.npcManager.update(delta, this.player.position);

    // 6. Police, Evidence, Arrest & Emergency Ecosystem
    const activeCops = this.policeManager.getActivePolice();
    this.wantedSystem.update(delta, this.player.position, activeCops);
    this.policeManager.update(delta, this.player.position);
    this.arrestSystem.update(delta, this.player, activeCops, this.wantedSystem.wantedLevel);
    this.evidenceSystem.update(delta);
    this.emergencyServices.update(delta);

    // 7. Combat & Hit Reactions
    const combatTargets = {
      pedestrians: this.npcManager.getPedestrians(),
      vehicles: this.vehicleManager.getVehicles()
    };
    this.weaponSystem.update(delta, this.input, this.player.position, isDriving, combatTargets);
    this.projectileManager.update(delta);
    this.hitReaction.update(delta);
    this.weaponWheel.update();

    // 8. Missions & Random World Encounters
    this.missionManager.update(delta, this.player.position);
    this.randomEvents.update(delta, this.player.position);

    // Main Mission Heist triggers
    if (this.mainMission && this.mainMission.stage === 3) {
      const dist = this.player.position.distanceTo(this.cityData.landmarks.bank_vault_alley);
      if (dist < 6.0 && (this.input.isKeyPressed('KeyE') || this.input.isKeyPressed('KeyF'))) {
        this.mainMission.onBreachTerminal();
      }
    }
    if (this.mainMission && this.mainMission.stage === 4 && this.wantedSystem.wantedLevel === 0) {
      this.mainMission.onWantedCleared();
    }

    // 9. Atmosphere, Weather, Districts & Audio
    this.timeManager.update(delta, this.player.position, this.propSystem);
    this.weatherManager.update(delta, this.player.position);
    this.environmentEffects.update(delta, this.player.position);
    this.districtManager.update(this.player.position);
    this.soundEngine.update(delta);
    this.radioSystem.update(delta);

    // 10. Radar Minimap
    this.minimap.render(
      this.player.position,
      this.cameraCtrl.getYaw(),
      activeCops,
      this.trafficManager.getTrafficCars(),
      this.missionManager.getCurrentWaypoint(),
      this.wantedSystem.wantedLevel
    );

    // 11. Fullscreen Map & Telemetry
    this.mapMenu.updatePlayerPos(this.player.position);
    this.debugConsole.updatePlayerPos(
      this.player.position,
      this.npcManager.getPedestrians().length,
      this.trafficManager.getTrafficCars().length
    );
    this.performanceStats.updateEntities(
      this.npcManager.getPedestrians().length,
      this.trafficManager.getTrafficCars().length
    );

    // 12. End Input Frame
    this.input.endFrame();
  }
}

// Start Game FreeWorld on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameApp();
});
