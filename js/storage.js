/**
 * storage.js
 * localStorage wrapper for Clemi 2.0
 */

const Storage = {
    KEYS: {
        SETTINGS: 'clemi2_settings',
        PASSES: 'clemi2_passes',
        DIETZIES: 'clemi2_dietzies'
    },

    // Get item from localStorage
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },

    // Clear all Clemi 2.0 data
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });
    },

    // Initialize default settings
    initSettings() {
        let settings = this.get(this.KEYS.SETTINGS);
        if (!settings) {
            settings = {
                startValues: {
                    bauchumfang: null,
                    brustumfang: null,
                    gewicht: null
                },
                setupComplete: false
            };
            this.set(this.KEYS.SETTINGS, settings);
        }
        return settings;
    },

    // Initialize passes
    initPasses() {
        let passes = this.get(this.KEYS.PASSES);
        if (!passes) {
            passes = {
                gyrkewalk: {
                    id: 'gyrkewalk',
                    name: '#gyrkewalk',
                    target: 5,
                    icon: '👣',
                    type: 'simple',
                    stamps: [],
                    completedRounds: 0
                },
                sauna: {
                    id: 'sauna',
                    name: 'Sauna',
                    target: 10,
                    icon: '♨️',
                    type: 'simple',
                    stamps: [],
                    completedRounds: 0
                },
                fitness: {
                    id: 'fitness',
                    name: 'Fitness',
                    target: 15,
                    icon: '🏋️',
                    type: 'simple',
                    stamps: [],
                    completedRounds: 0
                },
                bauchumfang: {
                    id: 'bauchumfang',
                    name: 'Bauchumfang',
                    target: 10,
                    icon: '📏',
                    type: 'measurement',
                    direction: 'decrease',
                    unit: 'cm',
                    measurements: [],
                    currentStamps: 0,
                    completedRounds: 0
                },
                brustumfang: {
                    id: 'brustumfang',
                    name: 'Brustumfang',
                    target: 5,
                    icon: '📐',
                    type: 'measurement',
                    direction: 'increase',
                    unit: 'cm',
                    measurements: [],
                    currentStamps: 0,
                    completedRounds: 0
                },
                gewicht: {
                    id: 'gewicht',
                    name: 'Körpergewicht',
                    target: 10,
                    icon: '⚖️',
                    type: 'measurement',
                    direction: 'decrease',
                    unit: 'kg',
                    measurements: [],
                    currentStamps: 0,
                    completedRounds: 0
                }
            };
            this.set(this.KEYS.PASSES, passes);
        }
        return passes;
    },

    // Initialize dietzies
    initDietzies() {
        let dietzies = this.get(this.KEYS.DIETZIES);
        if (!dietzies) {
            dietzies = {
                available: 0,
                totalEarned: 0,
                totalRedeemed: 0,
                history: []
            };
            this.set(this.KEYS.DIETZIES, dietzies);
        }
        return dietzies;
    },

    // Get settings
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || this.initSettings();
    },

    // Update settings
    updateSettings(updates) {
        const settings = this.getSettings();
        const updated = { ...settings, ...updates };
        this.set(this.KEYS.SETTINGS, updated);
        return updated;
    },

    // Get all passes
    getPasses() {
        return this.get(this.KEYS.PASSES) || this.initPasses();
    },

    // Get single pass
    getPass(passId) {
        const passes = this.getPasses();
        return passes[passId];
    },

    // Update pass
    updatePass(passId, updates) {
        const passes = this.getPasses();
        passes[passId] = { ...passes[passId], ...updates };
        this.set(this.KEYS.PASSES, passes);
        return passes[passId];
    },

    // Get dietzies
    getDietzies() {
        return this.get(this.KEYS.DIETZIES) || this.initDietzies();
    },

    // Update dietzies
    updateDietzies(updates) {
        const dietzies = this.getDietzies();
        const updated = { ...dietzies, ...updates };
        this.set(this.KEYS.DIETZIES, updated);
        return updated;
    },

    // Export all data as JSON
    exportData() {
        return {
            settings: this.getSettings(),
            passes: this.getPasses(),
            dietzies: this.getDietzies(),
            exportDate: new Date().toISOString()
        };
    },

    // Import data from JSON
    importData(data) {
        try {
            if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
            if (data.passes) this.set(this.KEYS.PASSES, data.passes);
            if (data.dietzies) this.set(this.KEYS.DIETZIES, data.dietzies);
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
};
