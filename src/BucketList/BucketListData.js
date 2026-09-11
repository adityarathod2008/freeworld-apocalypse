/**
 * FreeWorld Engine - 100-Item Bucket List Database (Phase 13)
 * Authoritative 100 original activities categorized across 12 distinct themes:
 * Adventure, Travel, Vehicles, Food, Entertainment, Exploration, Relationships,
 * Survival, Comedy, Risk, Mystery, Personal Goals.
 */

export const BUCKET_LIST_CATEGORIES = {
  ADVENTURE: 'Adventure',
  TRAVEL: 'Travel',
  VEHICLES: 'Vehicles',
  FOOD: 'Food',
  ENTERTAINMENT: 'Entertainment',
  EXPLORATION: 'Exploration',
  RELATIONSHIPS: 'Relationships',
  SURVIVAL: 'Survival',
  COMEDY: 'Comedy',
  RISK: 'Risk',
  MYSTERY: 'Mystery',
  PERSONAL_GOALS: 'Personal Goals'
};

export const BUCKET_LIST_ITEMS = [
  // 1. ADVENTURE (8 items)
  { id: 'bl_adv_01', title: 'Skydive over Marina Harbor', description: 'Leap from a high-altitude helicopter into the marina bay.', category: 'Adventure', reward: { cash: 500, xp: 150 } },
  { id: 'bl_adv_02', title: 'Bord the Freight Train', description: 'Jump onto a moving industrial freight transport.', category: 'Adventure', reward: { cash: 300, xp: 100 } },
  { id: 'bl_adv_03', title: 'Zipline between Penthouses', description: 'Use an emergency zipline between Downtown high-rises.', category: 'Adventure', reward: { cash: 450, xp: 120 } },
  { id: 'bl_adv_04', title: 'Climb Harbor Crane #4', description: 'Reach the highest boom tip on Pier 4 crane.', category: 'Adventure', reward: { cash: 400, xp: 110 } },
  { id: 'bl_adv_05', title: 'Rappel Central Bank Shaft', description: 'Descend into the bank ventilation elevator shaft.', category: 'Adventure', reward: { cash: 600, xp: 200 } },
  { id: 'bl_adv_06', title: 'Bridge BASE Jump', description: 'Parachute from the suspension highway bridge.', category: 'Adventure', reward: { cash: 550, xp: 180 } },
  { id: 'bl_adv_07', title: 'Subway Tunnel Sprint', description: 'Outrun a train in the Metro Line 2 tunnel.', category: 'Adventure', reward: { cash: 350, xp: 140 } },
  { id: 'bl_adv_08', title: 'Rooftop Helipad Sprint', description: 'Sprint across three connected high-rise roofs.', category: 'Adventure', reward: { cash: 500, xp: 160 } },

  // 2. TRAVEL (8 items)
  { id: 'bl_trv_01', title: 'Visit All 4 City Districts', description: 'Step foot in Downtown, Harbor, Industrial & Suburbs.', category: 'Travel', reward: { cash: 250, xp: 80 } },
  { id: 'bl_trv_02', title: 'Sunset at Pier Marina', description: 'Watch solar sunset from the harbor docks.', category: 'Travel', reward: { cash: 200, xp: 50 } },
  { id: 'bl_trv_03', title: 'Explore Bayside Heights', description: 'Visit the residential penthouse quarter.', category: 'Travel', reward: { cash: 300, xp: 90 } },
  { id: 'bl_trv_04', title: 'Tour Apex Commercial Boulevard', description: 'Walk the full length of the neon commercial strip.', category: 'Travel', reward: { cash: 250, xp: 75 } },
  { id: 'bl_trv_05', title: 'Discover Industrial Plant 4', description: 'Locate the abandoned chemical refining facility.', category: 'Travel', reward: { cash: 350, xp: 110 } },
  { id: 'bl_trv_06', title: 'Cross Highway Overpass', description: 'Drive across the main city ring road.', category: 'Travel', reward: { cash: 200, xp: 60 } },
  { id: 'bl_trv_07', title: 'Explore Metro Level 2', description: 'Descend to the subterranean transit concourse.', category: 'Travel', reward: { cash: 400, xp: 130 } },
  { id: 'bl_trv_08', title: 'Find Safehouse Hideout', description: 'Unlock the underground garage safehouse.', category: 'Travel', reward: { cash: 500, xp: 150 } },

  // 3. VEHICLES (9 items)
  { id: 'bl_veh_01', title: 'Drive Supercar 200 MPH', description: 'Reach top speed on the highway straightaway.', category: 'Vehicles', reward: { cash: 600, xp: 200 } },
  { id: 'bl_veh_02', title: 'Drift Commercial Plaza', description: 'Execute a 360-degree drift around the plaza statue.', category: 'Vehicles', reward: { cash: 400, xp: 120 } },
  { id: 'bl_veh_03', title: 'Hotwire Police Patrol Cruiser', description: 'Steal a precinct patrol cruiser undetected.', category: 'Vehicles', reward: { cash: 450, xp: 150 } },
  { id: 'bl_veh_04', title: 'Steal Armored Bank Van', description: 'Carjack a heavy security transport truck.', category: 'Vehicles', reward: { cash: 800, xp: 250 } },
  { id: 'bl_veh_05', title: 'Perform 100m Ramp Jump', description: 'Launch off a construction ramp over the canal.', category: 'Vehicles', reward: { cash: 500, xp: 160 } },
  { id: 'bl_veh_06', title: 'Fly Police Helicopter', description: 'Pilot a police air patrol chopper.', category: 'Vehicles', reward: { cash: 750, xp: 220 } },
  { id: 'bl_veh_07', title: 'Refuel at City Gas Station', description: 'Fill a vehicle fuel tank to 100%.', category: 'Vehicles', reward: { cash: 150, xp: 40 } },
  { id: 'bl_veh_08', title: 'Repair Damaged Engine', description: 'Restore a broken down sedan to 100% condition.', category: 'Vehicles', reward: { cash: 300, xp: 90 } },
  { id: 'bl_veh_09', title: 'Carjack Occupied SUV', description: 'Eject a driver and take over a luxury SUV.', category: 'Vehicles', reward: { cash: 400, xp: 110 } },

  // 4. FOOD (8 items)
  { id: 'bl_foo_01', title: 'Eat Midnight Diner Burger', description: 'Purchase a meal at the 24/7 Downtown Diner.', category: 'Food', reward: { cash: 100, xp: 30 } },
  { id: 'bl_foo_02', title: 'Drink Espresso at Cafe', description: 'Order a coffee on Commercial Boulevard.', category: 'Food', reward: { cash: 80, xp: 25 } },
  { id: 'bl_foo_03', title: 'Loot Emergency MRE Rations', description: 'Find sealed military food rations in the vault.', category: 'Food', reward: { cash: 250, xp: 85 } },
  { id: 'bl_foo_04', title: 'Drink Fresh Filtered Water', description: 'Drink clean water before power grid failure.', category: 'Food', reward: { cash: 120, xp: 35 } },
  { id: 'bl_foo_05', title: 'Share Food with Survivor', description: 'Give canned food to an NPC in distress.', category: 'Food', reward: { cash: 300, xp: 100 } },
  { id: 'bl_foo_06', title: 'Eat Harbor Fish Market Dish', description: 'Try the fresh catch at Pier 4 market.', category: 'Food', reward: { cash: 150, xp: 45 } },
  { id: 'bl_foo_07', title: 'Stock Safehouse Pantry', description: 'Store 10 food items in the safehouse kitchen.', category: 'Food', reward: { cash: 400, xp: 130 } },
  { id: 'bl_foo_08', title: 'Find Canned Peaches', description: 'Loot rare canned peaches from an abandoned shop.', category: 'Food', reward: { cash: 200, xp: 60 } },

  // 5. ENTERTAINMENT (8 items)
  { id: 'bl_ent_01', title: 'Win Street Race Activity', description: 'Finish 1st place in the Commercial Boulevard race.', category: 'Entertainment', reward: { cash: 1000, xp: 300 } },
  { id: 'bl_ent_02', title: 'Listen to Full Radio Track', description: 'Tune into Bay City Radio for an entire song.', category: 'Entertainment', reward: { cash: 150, xp: 40 } },
  { id: 'bl_ent_03', title: 'Play Arcade Mini-Game', description: 'Score high score at the neon arcade cabinet.', category: 'Entertainment', reward: { cash: 300, xp: 95 } },
  { id: 'bl_ent_04', title: 'Watch Plaza Billboard Show', description: 'Watch the news broadcast on the main screen.', category: 'Entertainment', reward: { cash: 100, xp: 30 } },
  { id: 'bl_ent_05', title: 'Complete Courier Bounty', description: 'Deliver a package before the timer expires.', category: 'Entertainment', reward: { cash: 650, xp: 190 } },
  { id: 'bl_ent_06', title: 'Shoot Shooting Range Targets', description: 'Score 100% accuracy at Apex Armory range.', category: 'Entertainment', reward: { cash: 400, xp: 120 } },
  { id: 'bl_ent_07', title: 'Use Smartphone Banking App', description: 'Transfer funds via your personal smartphone.', category: 'Entertainment', reward: { cash: 200, xp: 50 } },
  { id: 'bl_ent_08', title: 'Dance at Neon Club', description: 'Visit the Downtown night club dancefloor.', category: 'Entertainment', reward: { cash: 250, xp: 70 } },

  // 6. EXPLORATION (9 items)
  { id: 'bl_exp_01', title: 'Inspect Bank Vault Terminal', description: 'Breach the Central Bank vault security desk.', category: 'Exploration', reward: { cash: 850, xp: 260 } },
  { id: 'bl_exp_02', title: 'Discover 5 Clues', description: 'Scan and inspect 5 evidence items in clue graph.', category: 'Exploration', reward: { cash: 500, xp: 160 } },
  { id: 'bl_exp_03', title: 'Enter Substation Control Room', description: 'Breach the District Power Station security door.', category: 'Exploration', reward: { cash: 450, xp: 140 } },
  { id: 'bl_exp_04', title: 'Loot Apex Armory Vault', description: 'Unlock the gun store weapons locker.', category: 'Exploration', reward: { cash: 700, xp: 210 } },
  { id: 'bl_exp_05', title: 'Explore BioLabs Sublevel 2', description: 'Access Dr. Vance\'s quarantine cleanroom.', category: 'Exploration', reward: { cash: 900, xp: 280 } },
  { id: 'bl_exp_06', title: 'Find Secret Sewer Passage', description: 'Locate the drainage outlet connecting to Pier 4.', category: 'Exploration', reward: { cash: 350, xp: 110 } },
  { id: 'bl_exp_07', title: 'Search Abandoned Cruiser', description: 'Inspect police cruiser FW-9941 on overpass.', category: 'Exploration', reward: { cash: 300, xp: 90 } },
  { id: 'bl_exp_08', title: 'Access Police Precinct Archive', description: 'Read suspect files in Detective Miller\'s office.', category: 'Exploration', reward: { cash: 600, xp: 180 } },
  { id: 'bl_exp_09', title: 'Find Rooftop Signal Tower', description: 'Reach the emergency radio broadcast antenna.', category: 'Exploration', reward: { cash: 550, xp: 170 } },

  // 7. RELATIONSHIPS (8 items)
  { id: 'bl_rel_01', title: 'Gain Marco\'s Trust (50%+)', description: 'Increase Marco Vance relationship trust score to 50.', category: 'Relationships', reward: { cash: 500, xp: 150 } },
  { id: 'bl_rel_02', title: 'Gain Dr. Vance\'s Trust (50%+)', description: 'Help Dr. Vance recover mutation lab logs.', category: 'Relationships', reward: { cash: 500, xp: 150 } },
  { id: 'bl_rel_03', title: 'Gain Detective Miller\'s Trust', description: 'Provide murder scene evidence to Detective Miller.', category: 'Relationships', reward: { cash: 600, xp: 180 } },
  { id: 'bl_rel_04', title: 'Befriend Officer Sarah Hayes', description: 'Assist Officer Hayes during a downtown patrol.', category: 'Relationships', reward: { cash: 450, xp: 130 } },
  { id: 'bl_rel_05', title: 'Save Civilian from Zombie', description: 'Rescue an NPC trapped by a zombie walker.', category: 'Relationships', reward: { cash: 400, xp: 120 } },
  { id: 'bl_rel_06', title: 'Unlock Marco\'s Secret Dialogue', description: 'Unlock high-trust conversation with Marco.', category: 'Relationships', reward: { cash: 350, xp: 100 } },
  { id: 'bl_rel_07', title: 'Form 3 Survivor Alliances', description: 'Maintain positive trust with 3 story characters.', category: 'Relationships', reward: { cash: 800, xp: 240 } },
  { id: 'bl_rel_08', title: 'Trade Supplies with Informant', description: 'Exchange ammo for medical supplies with Marco.', category: 'Relationships', reward: { cash: 300, xp: 90 } },

  // 8. SURVIVAL (9 items)
  { id: 'bl_sur_01', title: 'Survive 5-Star Police Chase', description: 'Evade a maximum wanted level pursuit.', category: 'Survival', reward: { cash: 1200, xp: 400 } },
  { id: 'bl_sur_02', title: 'Survive Night Outbreak', description: 'Survive solar midnight during total blackout.', category: 'Survival', reward: { cash: 600, xp: 180 } },
  { id: 'bl_sur_03', title: 'Eliminate Brute Zombie', description: 'Kill a heavy Brute variant in combat.', category: 'Survival', reward: { cash: 750, xp: 230 } },
  { id: 'bl_sur_04', title: 'Craft Medical Medkit', description: 'Use emergency supplies to restore 100% health.', category: 'Survival', reward: { cash: 250, xp: 70 } },
  { id: 'bl_sur_05', title: 'Escape 20-Zombie Horde', description: 'Outrun a mobilized zombie swarm.', category: 'Survival', reward: { cash: 700, xp: 220 } },
  { id: 'bl_sur_06', title: 'Cure Infection Stage 3', description: 'Use viral antidote to cure symptomatic infection.', category: 'Survival', reward: { cash: 500, xp: 160 } },
  { id: 'bl_sur_07', title: 'Hold Out in Bank Vault', description: 'Survive 3 minutes inside sealed vault.', category: 'Survival', reward: { cash: 800, xp: 250 } },
  { id: 'bl_sur_08', title: 'Kill Runner Zombie Mid-Sprint', description: 'Eliminate a fast Runner before it bites.', category: 'Survival', reward: { cash: 450, xp: 140 } },
  { id: 'bl_sur_09', title: 'Survive Blackout with Flashlight', description: 'Navigate dark district using only flashlight.', category: 'Survival', reward: { cash: 350, xp: 110 } },

  // 9. COMEDY (8 items)
  { id: 'bl_com_01', title: 'Honk Horn at Police Cruiser', description: 'Honk a vehicle horn continuously behind a cop.', category: 'Comedy', reward: { cash: 150, xp: 40 } },
  { id: 'bl_com_02', title: 'Steal Traffic Cone', description: 'Pick up and carry a neon orange street cone.', category: 'Comedy', reward: { cash: 100, xp: 25 } },
  { id: 'bl_com_03', title: 'Crash Sedan into Donut Shop', description: 'Drive through the window of the Downtown Donut Shop.', category: 'Comedy', reward: { cash: 300, xp: 90 } },
  { id: 'bl_com_04', title: 'Wear Hawaiian Shirt', description: 'Equip the bright tropical shirt outfit.', category: 'Comedy', reward: { cash: 200, xp: 50 } },
  { id: 'bl_com_05', title: 'Throw Burger at Zombie', description: 'Toss a fast food burger at an approaching zombie.', category: 'Comedy', reward: { cash: 250, xp: 75 } },
  { id: 'bl_com_06', title: 'Trigger Alarm and Run', description: 'Set off a car alarm and hide in a dumpster.', category: 'Comedy', reward: { cash: 200, xp: 60 } },
  { id: 'bl_com_07', title: 'Slip on Wet Pavement', description: 'Stumble while sprinting during heavy rain.', category: 'Comedy', reward: { cash: 120, xp: 30 } },
  { id: 'bl_com_08', title: 'Carjack Pizza Delivery Car', description: 'Steal the pizza car with the light-up sign.', category: 'Comedy', reward: { cash: 350, xp: 100 } },

  // 10. RISK (9 items)
  { id: 'bl_rsk_01', title: 'Drive on Wrong Side of Highway', description: 'Speed against oncoming traffic for 500m.', category: 'Risk', reward: { cash: 500, xp: 150 } },
  { id: 'bl_rsk_02', title: 'Stand Next to Ignited Fuel Tank', description: 'Shoot a gas cylinder while standing close.', category: 'Risk', reward: { cash: 450, xp: 130 } },
  { id: 'bl_rsk_03', title: 'Disarm C4 Explosive', description: 'Successfully disarm explosive charge at sub-station.', category: 'Risk', reward: { cash: 850, xp: 270 } },
  { id: 'bl_rsk_04', title: 'Steal Getaway Car with 1 HP', description: 'Escape an ambush while health is below 5%.', category: 'Risk', reward: { cash: 700, xp: 210 } },
  { id: 'bl_rsk_05', title: 'Walk Past Screamer Undetected', description: 'Sneak past a Screamer zombie without triggering scream.', category: 'Risk', reward: { cash: 600, xp: 180 } },
  { id: 'bl_rsk_06', title: 'Breach Checkpoint Barricade', description: 'Ram a military blockade at 100 MPH.', category: 'Risk', reward: { cash: 750, xp: 230 } },
  { id: 'bl_rsk_07', title: 'Rob ATM in Broad Daylight', description: 'Hackle an ATM while civilians watch.', category: 'Risk', reward: { cash: 500, xp: 160 } },
  { id: 'bl_rsk_08', title: 'Jump Off Moving Helicopter', description: 'Bail out of an aircraft over the river.', category: 'Risk', reward: { cash: 900, xp: 290 } },
  { id: 'bl_rsk_09', title: 'Taunt Police Dispatch', description: 'Fire weapon directly outside Precinct 4 entrance.', category: 'Risk', reward: { cash: 400, xp: 120 } },

  // 11. MYSTERY (8 items)
  { id: 'bl_mys_01', title: 'Decode Encrypted Journal Note', description: 'Decrypt the torn page found in the safehouse.', category: 'Mystery', reward: { cash: 600, xp: 190 } },
  { id: 'bl_mys_02', title: 'Find Nexus Corp Chemical Manifest', description: 'Locate illegal shipping records at Pier 4.', category: 'Mystery', reward: { cash: 750, xp: 230 } },
  { id: 'bl_mys_03', title: 'Connect 3 Clues in Clue Graph', description: 'Link Location, Character, and Objective nodes.', category: 'Mystery', reward: { cash: 500, xp: 150 } },
  { id: 'bl_mys_04', title: 'Listen to SOS Broadcast Tape', description: 'Play recorded emergency tape from radio station.', category: 'Mystery', reward: { cash: 400, xp: 120 } },
  { id: 'bl_mys_05', title: 'Uncover Lab Quarantine Sabotage', description: 'Inspect scorched breaker panel at power station.', category: 'Mystery', reward: { cash: 650, xp: 200 } },
  { id: 'bl_mys_06', title: 'Identify Zero Patient Log', description: 'Read initial hospital chart in General ER.', category: 'Mystery', reward: { cash: 700, xp: 210 } },
  { id: 'bl_mys_07', title: 'Find Detective Miller\'s Secret Note', description: 'Inspect burner phone on city plaza bench.', category: 'Mystery', reward: { cash: 450, xp: 140 } },
  { id: 'bl_mys_08', title: 'Expose Nexus Bio-Spill Coverup', description: 'Unlock all mystery nodes in clue graph.', category: 'Mystery', reward: { cash: 1200, xp: 400 } },

  // 12. PERSONAL GOALS (8 items)
  { id: 'bl_gol_01', title: 'Accumulate $50,000 Cash', description: 'Save $50,000 in your personal bank account.', category: 'Personal Goals', reward: { cash: 1500, xp: 500 } },
  { id: 'bl_gol_02', title: 'Complete 100% Story Campaign', description: 'Finish all 6 narrative chapters and final choice.', category: 'Personal Goals', reward: { cash: 2000, xp: 600 } },
  { id: 'bl_gol_03', title: 'Own All 4 Weapon Types', description: 'Acquire Fists, Pistol, Rifle, and Shotgun.', category: 'Personal Goals', reward: { cash: 600, xp: 180 } },
  { id: 'bl_gol_04', title: 'Unlock All 6 Flashbacks', description: 'Discover every memory fragment in Bay City.', category: 'Personal Goals', reward: { cash: 1000, xp: 300 } },
  { id: 'bl_gol_05', title: 'Achieve 100% Bucket List', description: 'Complete all 100 activities in freedom ledger.', category: 'Personal Goals', reward: { cash: 5000, xp: 1500 } },
  { id: 'bl_gol_06', title: 'Survive 30 Days in City', description: 'Survive 30 in-game day/night solar cycles.', category: 'Personal Goals', reward: { cash: 1500, xp: 450 } },
  { id: 'bl_gol_07', title: 'Max Out Stamina Bar', description: 'Upgrade player stamina capacity to maximum.', category: 'Personal Goals', reward: { cash: 450, xp: 130 } },
  { id: 'bl_gol_08', title: 'Collect All 11 Clue Artifacts', description: 'Store every inspectable clue in evidence store.', category: 'Personal Goals', reward: { cash: 1200, xp: 380 } }
];
