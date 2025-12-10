/**
 * app.js
 * Main application logic for Clemi 2.0
 */

const App = {
    currentCardIndex: 0,
    passes: [],
    longPressTimer: null,
    longPressTarget: null,

    // Initialize app
    init() {
        // Initialize storage
        Storage.initSettings();
        Storage.initPasses();
        Storage.initDietzies();

        // Load passes
        this.loadPasses();

        // Check if onboarding needed
        const settings = Storage.getSettings();
        if (!settings.setupComplete) {
            this.showOnboarding();
        }

        // Render cards
        this.renderCards();

        // Setup event listeners
        this.setupEventListeners();

        // Update dietzie counter
        this.updateDietzieCounter();

        // Setup swipe
        this.setupSwipe();
    },

    // Load passes from storage
    loadPasses() {
        const passesData = Storage.getPasses();
        this.passes = Object.values(passesData);
    },

    // Render all cards
    renderCards() {
        const track = document.getElementById('carouselTrack');
        track.innerHTML = '';

        this.passes.forEach((pass, index) => {
            const card = this.createCard(pass, index);
            track.appendChild(card);
        });

        this.updateCarousel();
    },

    // Create a pass card
    createCard(pass, index) {
        const card = document.createElement('div');
        card.className = 'pass-card';
        card.setAttribute('data-index', String(index));
        card.setAttribute('data-pass-id', pass.id);

        // Check if measurement pass without start value
        if (pass.type === 'measurement' && !PassManager.isMeasurementEnabled(pass.id)) {
            card.classList.add('disabled');
        }

        // Header - iOS Safari fix: build DOM elements instead of innerHTML
        const header = document.createElement('div');
        header.className = 'pass-header';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'pass-icon';
        iconDiv.textContent = pass.icon;
        header.appendChild(iconDiv);

        const titleEl = document.createElement('h2');
        titleEl.className = 'pass-title';
        titleEl.textContent = pass.name;
        header.appendChild(titleEl);

        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'pass-subtitle';
        subtitleEl.textContent = PassManager.getProgressText(pass);
        header.appendChild(subtitleEl);

        card.appendChild(header);

        // Stamp grid
        const grid = this.createStampGrid(pass);
        card.appendChild(grid);

        // Progress bar
        const progress = this.createProgressBar(pass);
        card.appendChild(progress);

        // Measurement button or current value display
        if (pass.type === 'measurement' && PassManager.isMeasurementEnabled(pass.id)) {
            const measurementBtn = document.createElement('button');
            measurementBtn.className = 'measurement-button';
            measurementBtn.textContent = 'Neuen Messwert eingeben';
            measurementBtn.onclick = () => this.showMeasurementInput(pass.id);
            card.appendChild(measurementBtn);

            const currentValue = PassManager.getCurrentValue(pass.id);
            if (currentValue !== null) {
                const currentDisplay = document.createElement('div');
                currentDisplay.className = 'measurement-current';
                const settings = Storage.getSettings();
                const startValue = settings.startValues[pass.id];
                currentDisplay.textContent = `Aktuell: ${currentValue} ${pass.unit} (Start: ${startValue} ${pass.unit})`;
                card.appendChild(currentDisplay);
            }
        }

        return card;
    },

    // Create stamp grid
    createStampGrid(pass) {
        const container = document.createElement('div');
        const grid = document.createElement('div');
        grid.className = 'stamp-grid';

        const stampCount = PassManager.getStampCount(pass);

        for (let i = 0; i < pass.target; i++) {
            const field = document.createElement('div');
            field.className = 'stamp-field';
            field.setAttribute('data-pass-id', pass.id);
            field.setAttribute('data-index', String(i));

            // iOS Safari fix: create inner content element instead of using ::before
            const content = document.createElement('span');
            content.className = 'stamp-field-content';

            if (i < stampCount) {
                field.classList.add('stamped');
                content.textContent = pass.icon;
            } else if (pass.type === 'simple') {
                // Only simple passes can be tapped
                field.onclick = () => this.onStampTap(pass.id, i);
            }

            field.appendChild(content);

            // Long press for undo
            if (i < stampCount) {
                field.addEventListener('touchstart', (e) => this.onLongPressStart(e, pass.id, i), { passive: true });
                field.addEventListener('touchend', (e) => this.onLongPressEnd(e), { passive: true });
                field.addEventListener('touchcancel', (e) => this.onLongPressEnd(e), { passive: true });
                field.addEventListener('mousedown', (e) => this.onLongPressStart(e, pass.id, i));
                field.addEventListener('mouseup', (e) => this.onLongPressEnd(e));
                field.addEventListener('mouseleave', (e) => this.onLongPressEnd(e));
            }

            grid.appendChild(field);
        }

        container.appendChild(grid);
        return container;
    },

    // Create progress bar - iOS Safari fix: build DOM elements instead of innerHTML
    createProgressBar(pass) {
        const container = document.createElement('div');
        container.className = 'progress-container';

        const progress = PassManager.getProgress(pass);

        const progressBarDiv = document.createElement('div');
        progressBarDiv.className = 'progress-bar';

        const progressFillDiv = document.createElement('div');
        progressFillDiv.className = 'progress-fill';
        progressFillDiv.style.width = progress + '%';
        progressBarDiv.appendChild(progressFillDiv);

        const progressTextP = document.createElement('p');
        progressTextP.className = 'progress-text';
        progressTextP.textContent = PassManager.getProgressText(pass);

        container.appendChild(progressBarDiv);
        container.appendChild(progressTextP);

        return container;
    },

    // Handle stamp tap
    onStampTap(passId, index) {
        const pass = Storage.getPass(passId);
        if (pass.type !== 'simple') return;

        // Only allow tapping the next empty field
        const currentCount = PassManager.getStampCount(pass);
        if (index !== currentCount) return;

        // Add stamp
        const success = PassManager.addStamp(passId);
        if (success) {
            // Animate
            const field = document.querySelector('.stamp-field[data-pass-id="' + passId + '"][data-index="' + index + '"]');
            if (field) {
                field.classList.add('animating');
                const content = field.querySelector('.stamp-field-content');
                setTimeout(function() {
                    field.classList.remove('animating');
                    field.classList.add('stamped');
                    if (content) {
                        content.textContent = pass.icon;
                    }
                    field.onclick = null; // Remove click handler
                }, 300);
            }

            // Audio feedback
            AudioEngine.stampFeedback();

            // Update UI
            this.updateCardUI(passId);
        }
    },

    // Long press handlers
    onLongPressStart(e, passId, index) {
        this.longPressTarget = { passId, index };
        const field = e.currentTarget;

        this.longPressTimer = setTimeout(() => {
            field.classList.add('long-pressing');
            this.showUndoConfirm(passId);
        }, 500);
    },

    onLongPressEnd(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        if (e.currentTarget) {
            e.currentTarget.classList.remove('long-pressing');
        }
        this.longPressTarget = null;
    },

    // Show undo confirmation
    showUndoConfirm(passId) {
        const pass = Storage.getPass(passId);
        const message = pass.type === 'simple'
            ? 'Letzten Stempel entfernen?'
            : 'Letzten Messwert zurücksetzen?';

        this.showConfirm(message, () => {
            if (pass.type === 'simple') {
                PassManager.removeStamp(passId);
            } else {
                PassManager.removeMeasurement(passId);
            }
            this.renderCards();
            this.updateCarousel();
        });
    },

    // Show measurement input modal
    showMeasurementInput(passId) {
        const pass = Storage.getPass(passId);
        const modal = document.getElementById('measurementModal');
        const title = document.getElementById('measurementTitle');
        const label = document.getElementById('measurementLabel');
        const input = document.getElementById('measurementInput');
        const unit = document.getElementById('measurementUnit');
        const info = document.getElementById('measurementInfo');

        title.textContent = pass.name;
        label.textContent = 'Aktueller Wert:';
        unit.textContent = pass.unit;
        input.value = '';
        info.innerHTML = '';

        modal.classList.add('active');
        input.focus();

        // Store passId for submit
        modal.dataset.passId = passId;
    },

    // Submit measurement
    submitMeasurement() {
        const modal = document.getElementById('measurementModal');
        const passId = modal.dataset.passId;
        const input = document.getElementById('measurementInput');
        const value = parseFloat(input.value);

        if (isNaN(value) || value <= 0) {
            this.showConfirm('Bitte gültigen Wert eingeben.', null, true);
            return;
        }

        const result = PassManager.addMeasurement(passId, value);

        if (!result.success) {
            this.showConfirm(result.error || 'Fehler beim Speichern', null, true);
            return;
        }

        // Close modal
        modal.classList.remove('active');

        // Animate stamps if earned
        if (result.stampsEarned > 0) {
            this.animateEarnedStamps(passId, result.stampsEarned);
        } else {
            this.renderCards();
            this.updateCarousel();
        }
    },

    // Animate earned stamps
    animateEarnedStamps(passId, count) {
        const pass = Storage.getPass(passId);
        const startIndex = pass.currentStamps - count;
        const self = this;

        let animated = 0;
        var animateNext = function() {
            if (animated >= count) {
                self.renderCards();
                self.updateCarousel();
                return;
            }

            const idx = startIndex + animated;
            const field = document.querySelector('.stamp-field[data-pass-id="' + passId + '"][data-index="' + idx + '"]');
            if (field) {
                field.classList.add('animating');
                const content = field.querySelector('.stamp-field-content');
                setTimeout(function() {
                    field.classList.remove('animating');
                    field.classList.add('stamped');
                    if (content) {
                        content.textContent = pass.icon;
                    }
                }, 300);
            }

            AudioEngine.stampFeedback();
            animated++;
            setTimeout(animateNext, 400);
        };

        animateNext();
    },

    // Update card UI
    updateCardUI(passId) {
        const pass = Storage.getPass(passId);
        const card = document.querySelector(`.pass-card[data-pass-id="${passId}"]`);
        if (!card) return;

        // Update subtitle
        const subtitle = card.querySelector('.pass-subtitle');
        if (subtitle) {
            subtitle.textContent = PassManager.getProgressText(pass);
        }

        // Update progress bar
        const progressFill = card.querySelector('.progress-fill');
        const progressText = card.querySelector('.progress-text');
        if (progressFill && progressText) {
            const progress = PassManager.getProgress(pass);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = PassManager.getProgressText(pass);
        }
    },

    // Show completion modal
    showCompletion(passId) {
        const pass = Storage.getPass(passId);
        const modal = document.getElementById('completionModal');
        const message = document.getElementById('completionMessage');

        message.textContent = `${pass.name} vollständig!`;
        modal.classList.add('active');
        modal.dataset.passId = passId;
    },

    // Reset pass after completion
    resetPassAfterCompletion() {
        const modal = document.getElementById('completionModal');
        const passId = modal.dataset.passId;

        PassManager.resetPass(passId);
        modal.classList.remove('active');

        this.renderCards();
        this.updateCarousel();
    },

    // Update dietzie counter
    updateDietzieCounter() {
        const count = DietzieManager.getAvailable();
        const countEl = document.getElementById('dietzieCount');
        if (countEl) {
            countEl.textContent = count;
        }
    },

    // Show dietzie modal
    showDietzieModal() {
        const modal = document.getElementById('dietzieModal');
        const available = DietzieManager.getAvailable();
        const history = DietzieManager.getHistory();

        // Update available count
        document.getElementById('dietzieAvailable').textContent = available;

        // Update icons
        const iconsEl = document.getElementById('dietzieIcons');
        iconsEl.innerHTML = '🍺 '.repeat(available);

        // Update redeem button
        const redeemBtn = document.getElementById('redeemBtn');
        redeemBtn.disabled = available === 0;

        // Update history
        const historyEl = document.getElementById('dietzieHistory');
        historyEl.innerHTML = '';

        if (history.length === 0) {
            historyEl.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">Noch keine Einträge</p>';
        } else {
            history.slice().reverse().forEach(item => {
                const formatted = DietzieManager.formatHistoryItem(item);
                const div = document.createElement('div');
                div.className = `history-item ${formatted.type}`;
                div.innerHTML = `
                    <span>${formatted.text}</span>
                    <span>${formatted.date}</span>
                `;
                historyEl.appendChild(div);
            });
        }

        modal.classList.add('active');
    },

    // Redeem dietzie
    redeemDietzie() {
        this.showConfirm('Dietzie jetzt einlösen?', () => {
            const success = DietzieManager.redeemDietzie();
            if (success) {
                this.showDietzieModal(); // Refresh modal
            }
        });
    },

    // Show onboarding
    showOnboarding() {
        const modal = document.getElementById('onboardingModal');
        modal.classList.add('active');
    },

    // Complete onboarding
    completeOnboarding() {
        const bauch = parseFloat(document.getElementById('startBauch').value);
        const brust = parseFloat(document.getElementById('startBrust').value);
        const gewicht = parseFloat(document.getElementById('startGewicht').value);

        const settings = Storage.getSettings();
        settings.startValues.bauchumfang = isNaN(bauch) ? null : bauch;
        settings.startValues.brustumfang = isNaN(brust) ? null : brust;
        settings.startValues.gewicht = isNaN(gewicht) ? null : gewicht;
        settings.setupComplete = true;

        Storage.updateSettings(settings);

        const modal = document.getElementById('onboardingModal');
        modal.classList.remove('active');

        this.renderCards();
        this.updateCarousel();
    },

    // Skip onboarding
    skipOnboarding() {
        const settings = Storage.getSettings();
        settings.setupComplete = true;
        Storage.updateSettings(settings);

        const modal = document.getElementById('onboardingModal');
        modal.classList.remove('active');

        this.renderCards();
        this.updateCarousel();
    },

    // Show settings modal
    showSettings() {
        const modal = document.getElementById('settingsModal');
        const settings = Storage.getSettings();

        document.getElementById('settingsBauch').value = settings.startValues.bauchumfang || '';
        document.getElementById('settingsBrust').value = settings.startValues.brustumfang || '';
        document.getElementById('settingsGewicht').value = settings.startValues.gewicht || '';

        modal.classList.add('active');
    },

    // Save settings
    saveSettings() {
        const bauch = parseFloat(document.getElementById('settingsBauch').value);
        const brust = parseFloat(document.getElementById('settingsBrust').value);
        const gewicht = parseFloat(document.getElementById('settingsGewicht').value);

        const settings = Storage.getSettings();
        settings.startValues.bauchumfang = isNaN(bauch) ? null : bauch;
        settings.startValues.brustumfang = isNaN(brust) ? null : brust;
        settings.startValues.gewicht = isNaN(gewicht) ? null : gewicht;

        Storage.updateSettings(settings);

        const modal = document.getElementById('settingsModal');
        modal.classList.remove('active');

        this.renderCards();
        this.updateCarousel();
    },

    // Export data
    exportData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `clemi2-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    // Reset app
    resetApp() {
        this.showConfirm('WIRKLICH alle Daten löschen? Dies kann nicht rückgängig gemacht werden!', () => {
            this.showConfirm('LETZTE WARNUNG: Alle Daten werden unwiderruflich gelöscht!', () => {
                Storage.clearAll();
                location.reload();
            });
        });
    },

    // Show confirm dialog
    showConfirm(message, onConfirm, isAlert = false) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');

        messageEl.textContent = message;

        if (isAlert) {
            cancelBtn.style.display = 'none';
            okBtn.textContent = 'OK';
        } else {
            cancelBtn.style.display = 'block';
            okBtn.textContent = 'Bestätigen';
        }

        modal.classList.add('active');

        okBtn.onclick = () => {
            modal.classList.remove('active');
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = () => {
            modal.classList.remove('active');
        };
    },

    // Carousel navigation
    navigateCarousel(direction) {
        this.currentCardIndex += direction;
        this.currentCardIndex = Math.max(0, Math.min(this.passes.length - 1, this.currentCardIndex));
        this.updateCarousel();
    },

    // Update carousel position
    updateCarousel() {
        const track = document.getElementById('carouselTrack');
        const offset = -this.currentCardIndex * 100;
        track.style.transform = `translateX(${offset}%)`;

        // Update indicator
        document.getElementById('navIndicator').textContent = `Pass ${this.currentCardIndex + 1}/${this.passes.length}`;

        // Update nav buttons
        document.getElementById('navPrev').disabled = this.currentCardIndex === 0;
        document.getElementById('navNext').disabled = this.currentCardIndex === this.passes.length - 1;
    },

    // Setup swipe gesture
    setupSwipe() {
        const container = document.getElementById('carouselTrack');
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const onStart = (e) => {
            isDragging = true;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            currentX = startX;
        };

        const onMove = (e) => {
            if (!isDragging) return;
            currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const diff = currentX - startX;
            const offset = -this.currentCardIndex * 100;
            const percentDiff = (diff / window.innerWidth) * 100;
            container.style.transform = `translateX(${offset + percentDiff}%)`;
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;

            const diff = currentX - startX;
            const threshold = 50;

            if (diff > threshold && this.currentCardIndex > 0) {
                this.navigateCarousel(-1);
            } else if (diff < -threshold && this.currentCardIndex < this.passes.length - 1) {
                this.navigateCarousel(1);
            } else {
                this.updateCarousel();
            }
        };

        container.addEventListener('touchstart', onStart, { passive: true });
        container.addEventListener('touchmove', onMove, { passive: true });
        container.addEventListener('touchend', onEnd, { passive: true });
        container.addEventListener('mousedown', onStart);
        container.addEventListener('mousemove', onMove);
        container.addEventListener('mouseup', onEnd);
        container.addEventListener('mouseleave', onEnd);
    },

    // Setup all event listeners
    setupEventListeners() {
        // Header buttons
        document.getElementById('settingsBtn').onclick = () => this.showSettings();
        document.getElementById('dietzieCounter').onclick = () => this.showDietzieModal();

        // Navigation
        document.getElementById('navPrev').onclick = () => this.navigateCarousel(-1);
        document.getElementById('navNext').onclick = () => this.navigateCarousel(1);

        // Onboarding modal
        document.getElementById('skipOnboarding').onclick = () => this.skipOnboarding();
        document.getElementById('completeOnboarding').onclick = () => this.completeOnboarding();

        // Dietzie modal
        document.getElementById('closeDietzieModal').onclick = () => {
            document.getElementById('dietzieModal').classList.remove('active');
        };
        document.getElementById('redeemBtn').onclick = () => this.redeemDietzie();

        // Settings modal
        document.getElementById('closeSettingsModal').onclick = () => {
            document.getElementById('settingsModal').classList.remove('active');
        };
        document.getElementById('saveSettings').onclick = () => this.saveSettings();
        document.getElementById('exportData').onclick = () => this.exportData();
        document.getElementById('resetApp').onclick = () => this.resetApp();

        // Measurement modal
        document.getElementById('closeMeasurementModal').onclick = () => {
            document.getElementById('measurementModal').classList.remove('active');
        };
        document.getElementById('cancelMeasurement').onclick = () => {
            document.getElementById('measurementModal').classList.remove('active');
        };
        document.getElementById('submitMeasurement').onclick = () => this.submitMeasurement();

        // Completion modal
        document.getElementById('resetPassBtn').onclick = () => this.resetPassAfterCompletion();

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            };
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('Service Worker registration failed:', err);
    });
}
