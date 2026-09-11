/**
 * FreeWorld Engine - Character Registry (Phase 8)
 * Manages persistent story characters, relationships, trust, memory, dialogue, and decision history.
 */

export class CharacterRegistry {
    constructor() {
        this.characters = new Map();
        this.initializeDefaultCharacters();
    }

    /**
     * Initializes core narrative characters for the FreeWorld story arc.
     */
    initializeDefaultCharacters() {
        const defaults = [
            {
                id: 'char_marco',
                name: 'Marco Vance',
                title: 'Former Security Chief',
                personality: { bravery: 0.8, fear: 0.2, aggression: 0.6, trustThreshold: 40 },
                background: 'Ex-head of security at Nexus Corp, now hiding in the Industrial District.',
                goals: ['Expose Nexus Corp contamination coverup', 'Survive police crackdown'],
                fear: 25,
                trust: 30, // 0-100
                relationships: { 'char_dr_vance': 'sibling', 'char_miller': 'rival' },
                memory: ['Observed illegal chemical dumping at Docks'],
                dialogue: [
                    { id: 'marco_intro', text: 'You shouldn\'t be here. The city is watching every camera.', requiredTrust: 0 },
                    { id: 'marco_secret', text: ' Nexus Corp planted false evidence in the precinct database.', requiredTrust: 50 }
                ],
                storyRole: 'Key Informant',
                location: { x: -120, y: 1.5, z: 240 },
                alive: true,
                decisionHistory: []
            },
            {
                id: 'char_dr_vance',
                name: 'Dr. Elena Vance',
                title: 'Lead Virologist',
                personality: { bravery: 0.4, fear: 0.7, aggression: 0.1, trustThreshold: 60 },
                background: 'Senior researcher at Metro BioLabs.',
                goals: ['Contain infection outbreak', 'Protect lab data'],
                fear: 65,
                trust: 20,
                relationships: { 'char_marco': 'sibling' },
                memory: ['Discovered pathogen mutation sample in West District'],
                dialogue: [
                    { id: 'vance_plea', text: 'Please, I need the patient logs from the Downtown clinic before they erase them.', requiredTrust: 20 }
                ],
                storyRole: 'Scientific Lead',
                location: { x: 310, y: 12.0, z: -80 },
                alive: true,
                decisionHistory: []
            },
            {
                id: 'char_miller',
                name: 'Detective Frank Miller',
                title: 'Lead Homicide Investigator',
                personality: { bravery: 0.9, fear: 0.1, aggression: 0.7, trustThreshold: 50 },
                background: 'Veteran detective suspicious of precinct corruption.',
                goals: ['Solve harbor murders', 'Maintain order in Precinct 4'],
                fear: 10,
                trust: 40,
                relationships: { 'char_marco': 'suspect', 'char_hayes': 'subordinate' },
                memory: ['Interrogated suspect at North Checkpoint'],
                dialogue: [
                    { id: 'miller_warn', text: 'Stay out of active crime scenes, kid.', requiredTrust: 10 }
                ],
                storyRole: 'Law Enforcement Anchor',
                location: { x: 45, y: 0.0, z: -150 },
                alive: true,
                decisionHistory: []
            },
            {
                id: 'char_hayes',
                name: 'Officer Sarah Hayes',
                title: 'Patrol Officer',
                personality: { bravery: 0.6, fear: 0.4, aggression: 0.3, trustThreshold: 35 },
                background: 'Rookie officer assigned to Downtown patrol.',
                goals: ['Protect civilians', 'Report ANPR stolen vehicle matches'],
                fear: 35,
                trust: 50,
                relationships: { 'char_miller': 'superior' },
                memory: ['Patrolled High Street during blackout'],
                dialogue: [
                    { id: 'hayes_patrol', text: 'Keep safe. Dispatch reports stolen vehicles in this sector.', requiredTrust: 0 }
                ],
                storyRole: 'Precinct Contact',
                location: { x: 10, y: 0.0, z: 20 },
                alive: true,
                decisionHistory: []
            }
        ];

        defaults.forEach(c => this.registerCharacter(c));
    }

    /**
     * Registers a new character in the system.
     * @param {Object} charData 
     */
    registerCharacter(charData) {
        if (!charData.id) throw new Error("Character must have an id");
        const character = {
            id: charData.id,
            name: charData.name || 'Unknown',
            title: charData.title || 'Civilian',
            personality: charData.personality || { bravery: 0.5, fear: 0.5, aggression: 0.5, trustThreshold: 50 },
            background: charData.background || '',
            goals: charData.goals || [],
            fear: charData.fear || 0,
            trust: Math.min(100, Math.max(0, charData.trust || 0)),
            relationships: charData.relationships || {},
            memory: charData.memory || [],
            dialogue: charData.dialogue || [],
            storyRole: charData.storyRole || 'NPC',
            location: charData.location || { x: 0, y: 0, z: 0 },
            alive: charData.alive !== undefined ? charData.alive : true,
            decisionHistory: charData.decisionHistory || []
        };

        this.characters.set(character.id, character);
        return character;
    }

    /**
     * Returns character by ID.
     */
    getCharacter(charId) {
        return this.characters.get(charId) || null;
    }

    /**
     * Adjusts character trust level (0 to 100).
     */
    updateTrust(charId, delta) {
        const char = this.getCharacter(charId);
        if (!char) return 0;
        char.trust = Math.min(100, Math.max(0, char.trust + delta));
        return char.trust;
    }

    /**
     * Updates character relationship with another character.
     */
    setRelationship(charId, targetCharId, relationshipType) {
        const char = this.getCharacter(charId);
        if (char) {
            char.relationships[targetCharId] = relationshipType;
        }
    }

    /**
     * Appends an event to character memory.
     */
    recordMemory(charId, eventDescription) {
        const char = this.getCharacter(charId);
        if (char) {
            char.memory.push({
                timestamp: Date.now(),
                event: eventDescription
            });
        }
    }

    /**
     * Updates character position.
     */
    updateLocation(charId, location) {
        const char = this.getCharacter(charId);
        if (char && location) {
            char.location = { ...location };
        }
    }

    /**
     * Sets alive status.
     */
    setAliveState(charId, alive) {
        const char = this.getCharacter(charId);
        if (char) {
            char.alive = alive;
        }
    }

    /**
     * Records a decision in character decision history.
     */
    recordDecision(charId, decision) {
        const char = this.getCharacter(charId);
        if (char) {
            char.decisionHistory.push({
                timestamp: Date.now(),
                decision: decision
            });
        }
    }

    /**
     * Retrieves available dialogue lines based on trust level.
     */
    getAvailableDialogue(charId) {
        const char = this.getCharacter(charId);
        if (!char || !char.alive) return [];
        return char.dialogue.filter(d => char.trust >= d.requiredTrust);
    }

    /**
     * Serializes character states for saving.
     */
    toJSON() {
        const data = {};
        for (const [id, char] of this.characters.entries()) {
            data[id] = char;
        }
        return data;
    }

    /**
     * Deserializes character states from saved state.
     */
    fromJSON(data) {
        if (!data) return;
        this.characters.clear();
        for (const id in data) {
            this.registerCharacter(data[id]);
        }
    }
}
