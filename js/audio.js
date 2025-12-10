/**
 * audio.js
 * Web Audio API sound generation for Clemi 2.0
 */

const AudioEngine = {
    context: null,

    // Initialize Audio Context (lazy loading)
    init() {
        if (!this.context) {
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
            }
        }
    },

    // Play CHUNK sound (normal stamp)
    playChunk() {
        this.init();
        if (!this.context) return;

        try {
            const now = this.context.currentTime;

            // Oscillator for main tone
            const osc = this.context.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now); // 280 Hz - deep, mechanical

            // Gain envelope for punch
            const gain = this.context.createGain();
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            // Connect nodes
            osc.connect(gain);
            gain.connect(this.context.destination);

            // Play
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {
            console.warn('Error playing chunk sound:', e);
        }
    },

    // Play deeper CHUNK for completion
    playChunkDeep() {
        this.init();
        if (!this.context) return;

        try {
            const now = this.context.currentTime;

            // Lower frequency for deeper sound
            const osc = this.context.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now); // Lower pitch

            // Longer sustain
            const gain = this.context.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            // Add slight filter for warmth
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now);

            // Connect
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.context.destination);

            // Play
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {
            console.warn('Error playing deep chunk sound:', e);
        }
    },

    // Haptic feedback (if supported)
    vibrate(duration = 50) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    },

    // Combined feedback for stamp
    stampFeedback() {
        this.playChunk();
        this.vibrate(50);
    },

    // Combined feedback for completion
    completionFeedback() {
        this.playChunkDeep();
        this.vibrate([50, 50, 100]);
    }
};
