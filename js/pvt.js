/**
 * Phase 1: Psychomotor Vigilance Task (PVT).
 * Measures pure millisecond reaction time to visual stimulus with jittered random delay.
 */

class PVTPhase {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.trialsTotal = 3;
        this.currentTrial = 0;
        this.reactionTimes = [];
        this.anticipations = 0;
        this.state = 'IDLE'; // 'WAITING', 'ACTIVE', 'PENALTY'
        this.timeoutId = null;
        this.triggerTime = 0;
        this.animFrameId = null;

        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="phase-card pvt-card" id="pvt-target-zone">
                <div class="phase-header">
                    <span class="badge badge-cyan">FASE 1 DE 4</span>
                    <span class="trial-counter" id="pvt-counter">Ensayo 1 de 3</span>
                </div>
                <h2 class="phase-title">Reflejos Psicomotores (PVT)</h2>
                <p class="phase-instruction" id="pvt-instruction">
                    Toca la pantalla <strong>tan rápido como puedas</strong> en cuanto el botón cambie a verde.
                </p>

                <div class="pvt-button-wrapper">
                    <button class="pvt-action-btn state-waiting" id="pvt-btn" type="button">
                        <span class="pvt-icon" id="pvt-icon">🔴</span>
                        <span class="pvt-label" id="pvt-label">ESPERA LA SEÑAL...</span>
                        <span class="pvt-timer" id="pvt-timer">0 ms</span>
                    </button>
                </div>

                <div class="phase-footer-feedback" id="pvt-feedback">
                    Mantén el dedo listo sobre el botón
                </div>
            </div>
        `;

        this.targetZone = document.getElementById('pvt-target-zone');
        this.pvtBtn = document.getElementById('pvt-btn');
        this.pvtIcon = document.getElementById('pvt-icon');
        this.pvtLabel = document.getElementById('pvt-label');
        this.pvtTimer = document.getElementById('pvt-timer');
        this.pvtFeedback = document.getElementById('pvt-feedback');
        this.pvtCounter = document.getElementById('pvt-counter');

        const handleInteraction = (e) => {
            e.preventDefault();
            this.handleTap();
        };

        this.pvtBtn.addEventListener('pointerdown', handleInteraction);
    }

    start() {
        this.currentTrial = 0;
        this.reactionTimes = [];
        this.anticipations = 0;
        this.nextTrial();
    }

    nextTrial() {
        if (this.currentTrial >= this.trialsTotal) {
            this.finish();
            return;
        }

        this.currentTrial++;
        this.pvtCounter.textContent = `Ensayo ${this.currentTrial} de ${this.trialsTotal}`;
        this.state = 'WAITING';

        this.pvtBtn.className = 'pvt-action-btn state-waiting';
        this.pvtIcon.textContent = '🔴';
        this.pvtLabel.textContent = 'ESPERA LA SEÑAL...';
        this.pvtTimer.textContent = '0 ms';
        this.pvtTimer.style.opacity = '0';
        this.pvtFeedback.textContent = 'Atención enfocada... no te adelantes';
        this.pvtFeedback.className = 'phase-footer-feedback';

        // Random jitter delay between 1,600ms and 3,600ms
        const jitterMs = Math.floor(Math.random() * 2000) + 1600;
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => this.triggerStimulus(), jitterMs);
    }

    triggerStimulus() {
        if (this.state !== 'WAITING') return;

        this.state = 'ACTIVE';
        this.triggerTime = performance.now();

        this.pvtBtn.className = 'pvt-action-btn state-active';
        this.pvtIcon.textContent = '⚡';
        this.pvtLabel.textContent = '¡TOCA AHORA!';
        this.pvtTimer.style.opacity = '1';

        window.sounds.playTrigger();

        const updateLiveCounter = () => {
            if (this.state === 'ACTIVE') {
                const elapsed = Math.round(performance.now() - this.triggerTime);
                this.pvtTimer.textContent = `${elapsed} ms`;
                this.animFrameId = requestAnimationFrame(updateLiveCounter);
            }
        };
        this.animFrameId = requestAnimationFrame(updateLiveCounter);
    }

    handleTap() {
        if (this.state === 'WAITING') {
            // Anticipation / False Start
            clearTimeout(this.timeoutId);
            this.anticipations++;
            window.sounds.playFail();

            this.state = 'PENALTY';
            this.pvtBtn.className = 'pvt-action-btn state-penalty';
            this.pvtIcon.textContent = '⚠️';
            this.pvtLabel.textContent = '¡ANTICIPACIÓN!';
            this.pvtFeedback.textContent = 'Tocaste antes de la señal. Reiniciando ensayo...';
            this.pvtFeedback.className = 'phase-footer-feedback text-coral';

            this.currentTrial--; // Repeat trial
            setTimeout(() => this.nextTrial(), 1300);
            return;
        }

        if (this.state === 'ACTIVE') {
            cancelAnimationFrame(this.animFrameId);
            const rt = Math.round(performance.now() - this.triggerTime);
            this.reactionTimes.push(rt);
            this.state = 'IDLE';

            window.sounds.playTap();

            this.pvtBtn.className = 'pvt-action-btn state-recorded';
            this.pvtIcon.textContent = '✅';
            this.pvtLabel.textContent = '¡REGISTRADO!';
            this.pvtTimer.textContent = `${rt} ms`;

            let rating = '¡Excelente!';
            if (rt < 220) rating = '¡Reflejos nivel atleta! 🔥';
            else if (rt < 320) rating = 'Buen tiempo de reacción ⚡';
            else rating = 'Respuesta retardada ⏳';

            this.pvtFeedback.textContent = `${rt} ms — ${rating}`;
            this.pvtFeedback.className = 'phase-footer-feedback text-emerald';

            setTimeout(() => this.nextTrial(), 900);
        }
    }

    finish() {
        if (this.onComplete) {
            this.onComplete({
                reactionTimes: this.reactionTimes,
                anticipations: this.anticipations,
            });
        }
    }
}

window.PVTPhase = PVTPhase;
