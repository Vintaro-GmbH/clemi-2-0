/**
 * dietzies.js
 * Dietzie reward system for Clemi 2.0
 */

const DietzieManager = {
    // Award a dietzie
    awardDietzie(source) {
        const dietzies = Storage.getDietzies();

        dietzies.available += 1;
        dietzies.totalEarned += 1;
        dietzies.history.push({
            type: 'earned',
            source: source,
            timestamp: new Date().toISOString()
        });

        Storage.updateDietzies(dietzies);

        // Update UI if available
        if (window.App && window.App.updateDietzieCounter) {
            window.App.updateDietzieCounter();
        }

        // Audio feedback
        AudioEngine.completionFeedback();

        return dietzies.available;
    },

    // Redeem a dietzie
    redeemDietzie() {
        const dietzies = Storage.getDietzies();

        if (dietzies.available <= 0) {
            return false;
        }

        dietzies.available -= 1;
        dietzies.totalRedeemed += 1;
        dietzies.history.push({
            type: 'redeemed',
            timestamp: new Date().toISOString()
        });

        Storage.updateDietzies(dietzies);

        // Update UI if available
        if (window.App && window.App.updateDietzieCounter) {
            window.App.updateDietzieCounter();
        }

        // Audio feedback
        AudioEngine.stampFeedback();

        return true;
    },

    // Get available count
    getAvailable() {
        const dietzies = Storage.getDietzies();
        return dietzies.available;
    },

    // Get history
    getHistory() {
        const dietzies = Storage.getDietzies();
        return dietzies.history;
    },

    // Format history item for display
    formatHistoryItem(item) {
        const date = new Date(item.timestamp);
        const dateStr = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });

        if (item.type === 'earned') {
            const passes = Storage.getPasses();
            const passName = passes[item.source]?.name || item.source;
            return {
                text: `Verdient: ${passName}`,
                date: dateStr,
                type: 'earned'
            };
        } else {
            return {
                text: 'Eingelöst',
                date: dateStr,
                type: 'redeemed'
            };
        }
    }
};
