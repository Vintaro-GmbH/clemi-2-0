/**
 * passes.js
 * Pass/Stamp logic for Clemi 2.0
 */

const PassManager = {
    // Add stamp to simple pass
    addStamp(passId) {
        const pass = Storage.getPass(passId);
        if (!pass || pass.type !== 'simple') return false;

        // Check if already complete
        if (pass.stamps.length >= pass.target) {
            return false;
        }

        // Add new stamp
        const stamp = {
            id: pass.stamps.length + 1,
            timestamp: new Date().toISOString()
        };
        pass.stamps.push(stamp);

        // Save
        Storage.updatePass(passId, pass);

        // Check for completion
        if (pass.stamps.length >= pass.target) {
            this.onPassComplete(passId);
        }

        return true;
    },

    // Remove last stamp (undo)
    removeStamp(passId) {
        const pass = Storage.getPass(passId);
        if (!pass || pass.type !== 'simple') return false;

        if (pass.stamps.length > 0) {
            pass.stamps.pop();
            Storage.updatePass(passId, pass);
            return true;
        }

        return false;
    },

    // Add measurement
    addMeasurement(passId, value) {
        const pass = Storage.getPass(passId);
        if (!pass || pass.type !== 'measurement') return { success: false };

        const settings = Storage.getSettings();
        const startValue = settings.startValues[passId];

        if (startValue === null || startValue === undefined) {
            return {
                success: false,
                error: 'Kein Startwert gesetzt'
            };
        }

        // Calculate difference
        const diff = pass.direction === 'decrease'
            ? startValue - value
            : value - startValue;

        const newStamps = Math.max(0, Math.floor(diff));

        // Check if value goes in wrong direction
        if (diff < 0) {
            return {
                success: false,
                error: pass.direction === 'decrease'
                    ? 'Wert ist höher als Startwert'
                    : 'Wert ist niedriger als Startwert',
                diff: diff
            };
        }

        // Calculate stamps earned from this measurement
        const previousStamps = pass.currentStamps || 0;
        const stampsEarned = newStamps - previousStamps;

        // Add measurement
        const measurement = {
            value: value,
            timestamp: new Date().toISOString(),
            stampsEarned: stampsEarned
        };
        pass.measurements.push(measurement);
        pass.currentStamps = newStamps;

        // Save
        Storage.updatePass(passId, pass);

        // Check for completion
        if (newStamps >= pass.target) {
            this.onPassComplete(passId);
        }

        return {
            success: true,
            stampsEarned: stampsEarned,
            totalStamps: newStamps,
            startValue: startValue,
            currentValue: value,
            diff: diff
        };
    },

    // Remove last measurement (undo)
    removeMeasurement(passId) {
        const pass = Storage.getPass(passId);
        if (!pass || pass.type !== 'measurement') return false;

        if (pass.measurements.length > 0) {
            pass.measurements.pop();

            // Recalculate stamps
            if (pass.measurements.length > 0) {
                const lastMeasurement = pass.measurements[pass.measurements.length - 1];
                const settings = Storage.getSettings();
                const startValue = settings.startValues[passId];
                const diff = pass.direction === 'decrease'
                    ? startValue - lastMeasurement.value
                    : lastMeasurement.value - startValue;
                pass.currentStamps = Math.max(0, Math.floor(diff));
            } else {
                pass.currentStamps = 0;
            }

            Storage.updatePass(passId, pass);
            return true;
        }

        return false;
    },

    // Get current stamp count
    getStampCount(pass) {
        if (pass.type === 'simple') {
            return pass.stamps.length;
        } else {
            return pass.currentStamps || 0;
        }
    },

    // Get current value for measurement pass
    getCurrentValue(passId) {
        const pass = Storage.getPass(passId);
        if (!pass || pass.type !== 'measurement') return null;

        if (pass.measurements.length > 0) {
            return pass.measurements[pass.measurements.length - 1].value;
        }

        return null;
    },

    // Check if pass is complete
    isComplete(pass) {
        const count = this.getStampCount(pass);
        return count >= pass.target;
    },

    // Pass completion handler
    onPassComplete(passId) {
        // Award dietzie
        DietzieManager.awardDietzie(passId);

        // Trigger completion UI
        if (window.App && window.App.showCompletion) {
            setTimeout(() => {
                window.App.showCompletion(passId);
            }, 500);
        }
    },

    // Reset pass
    resetPass(passId) {
        const pass = Storage.getPass(passId);
        if (!pass) return false;

        if (pass.type === 'simple') {
            pass.stamps = [];
        } else {
            pass.measurements = [];
            pass.currentStamps = 0;
        }

        pass.completedRounds += 1;
        Storage.updatePass(passId, pass);

        return true;
    },

    // Get pass progress percentage
    getProgress(pass) {
        const count = this.getStampCount(pass);
        return Math.min(100, (count / pass.target) * 100);
    },

    // Get progress text
    getProgressText(pass) {
        const count = this.getStampCount(pass);
        if (pass.type === 'simple') {
            return `${count}/${pass.target} Stempel`;
        } else {
            return `${count}/${pass.target} ${pass.unit}`;
        }
    },

    // Check if measurement pass is enabled
    isMeasurementEnabled(passId) {
        const settings = Storage.getSettings();
        const startValue = settings.startValues[passId];
        return startValue !== null && startValue !== undefined;
    }
};
