/**
 * Game FreeWorld - NPCSchedule
 * Handles daily routines, jobs (Banker, Mechanic, Tourist, Dockworker), and destinations
 */
export const OCCUPATIONS = [
  { title: 'Executive Banker', fear: 0.9, aggression: 0.1, walkSpeed: 1.6 },
  { title: 'Street Pedestrian', fear: 0.7, aggression: 0.3, walkSpeed: 1.8 },
  { title: 'Dock Worker', fear: 0.4, aggression: 0.6, walkSpeed: 2.0 },
  { title: 'Tourist', fear: 0.85, aggression: 0.1, walkSpeed: 1.5 },
  { title: 'Security Guard', fear: 0.2, aggression: 0.8, walkSpeed: 2.2 }
];

export class NPCSchedule {
  constructor() {
    this.occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];
    this.currentActivity = 'COMMUTE'; // 'COMMUTE' | 'LOITER' | 'SHOP' | 'PHONE'
    this.activityTimer = 5.0 + Math.random() * 15.0;
  }

  update(delta) {
    this.activityTimer -= delta;
    if (this.activityTimer <= 0) {
      this.activityTimer = 10.0 + Math.random() * 20.0;
      const activities = ['COMMUTE', 'LOITER', 'PHONE'];
      this.currentActivity = activities[Math.floor(Math.random() * activities.length)];
    }
  }
}
