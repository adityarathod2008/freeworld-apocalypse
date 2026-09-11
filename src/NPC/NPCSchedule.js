/**
 * Game FreeWorld - NPCSchedule (v7.0 Phase 7)
 * Handles 24h daily routine state machine: WORK, HOME, SHOPPING, TRAVEL, SLEEP, SOCIAL, EMERGENCY, EVACUATION.
 */
export const OCCUPATIONS = [
  { title: 'Executive Banker', fear: 0.9, aggression: 0.1, walkSpeed: 1.6, workHour: 9, homeHour: 17 },
  { title: 'Street Pedestrian', fear: 0.7, aggression: 0.3, walkSpeed: 1.8, workHour: 10, homeHour: 18 },
  { title: 'Dock Worker', fear: 0.4, aggression: 0.6, walkSpeed: 2.0, workHour: 7, homeHour: 15 },
  { title: 'Tourist', fear: 0.85, aggression: 0.1, walkSpeed: 1.5, workHour: 11, homeHour: 20 },
  { title: 'Security Guard', fear: 0.2, aggression: 0.8, walkSpeed: 2.2, workHour: 20, homeHour: 6 }
];

export const SCHEDULE_STATES = {
  WORK: 'WORK',
  HOME: 'HOME',
  SHOPPING: 'SHOPPING',
  TRAVEL: 'TRAVEL',
  SLEEP: 'SLEEP',
  SOCIAL: 'SOCIAL',
  EMERGENCY: 'EMERGENCY',
  EVACUATION: 'EVACUATION'
};

export class NPCSchedule {
  constructor() {
    this.occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];
    this.state = SCHEDULE_STATES.TRAVEL;
    this.currentActivity = 'COMMUTE';
    this.activityTimer = 5.0 + Math.random() * 15.0;
  }

  evaluateSchedule(solarHour = 12, isEmergency = false, isEvacuation = false) {
    if (isEvacuation) {
      this.state = SCHEDULE_STATES.EVACUATION;
      return;
    }

    if (isEmergency) {
      this.state = SCHEDULE_STATES.EMERGENCY;
      return;
    }

    // 24h Routine State Machine
    if (solarHour >= 22 || solarHour < 6) {
      this.state = SCHEDULE_STATES.SLEEP;
    } else if (solarHour >= this.occupation.workHour && solarHour < this.occupation.homeHour) {
      this.state = SCHEDULE_STATES.WORK;
    } else if (solarHour >= this.occupation.homeHour && solarHour < this.occupation.homeHour + 2) {
      this.state = SCHEDULE_STATES.SHOPPING;
    } else if (solarHour >= 19 && solarHour < 22) {
      this.state = SCHEDULE_STATES.SOCIAL;
    } else {
      this.state = SCHEDULE_STATES.HOME;
    }
  }

  update(delta, solarHour = 12, isEmergency = false) {
    this.evaluateSchedule(solarHour, isEmergency);

    this.activityTimer -= delta;
    if (this.activityTimer <= 0) {
      this.activityTimer = 10.0 + Math.random() * 20.0;
      const activities = ['COMMUTE', 'LOITER', 'PHONE', 'SHOP'];
      this.currentActivity = activities[Math.floor(Math.random() * activities.length)];
    }
  }
}
