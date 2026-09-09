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
        this.countdownTimer = null;
        this.triggerTime = 0;
        this.animFrameId = null;

        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="phase-card pvt-card" id="pvt-target-zone">
                <div class="phase-header">
                    <span class="badge badge-cyan">FASE 1 DE 4</span>
                    <span class="trial-counter" id="pvt-counter">Preparación (Ensayo 1 de 3)</span>
                </div>
                <h2 class="phase-title">Reflejos Psicomotores (PVT)</h2>
                <p class="phase-instruction" id="pvt-instruction">
                    Toca la pantalla <strong>tan rápido como puedas</strong> en cuanto el botón cambie a verde.
                </p>

                <div class="pvt-button-wrapper">
                    <button class="pvt-action-btn state-countdown countdown-step-3" id="pvt-btn" type="button">
                        <span class="pvt-icon" id="pvt-icon">3</span>
                        <span class="pvt-label" id="pvt-label">🟢 TOCA EN VERDE</span>
                        <span class="pvt-timer" id="pvt-timer">¡Tan rápido como puedas!</span>
                    </button>
                </div>

                <div class="phase-footer-feedback" id="pvt-feedback">
                    Regla: Toca la pantalla en cuanto el botón cambie a verde
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
        this.startCountdown();
    }

    startCountdown() {
        this.state = 'COUNTDOWN';
        this.pvtCounter.textContent = 'Iniciando en 3s...';
        this.pvtTimer.style.opacity = '1';

        let count = 3;
        const steps = {
            3: { 
                num: '3', 
                label: '🟢 TOCA EN VERDE', 
                timer: '¡Tan rápido como puedas!', 
                feedback: 'Regla 1: Toca la pantalla cuando el botón sea verde', 
                freq: 440,
                cls: 'countdown-step-3'
            },
            2: { 
                num: '2', 
                label: '🔴 NO TE ADELANTES', 
                timer: 'Espera la señal', 
                feedback: 'Regla 2: Mantén el pulgar listo sin tocar antes', 
                freq: 554.37,
                cls: 'countdown-step-2'
            },
            1: { 
                num: '1', 
                label: '⚡ ¡CONCÉNTRATE!', 
                timer: '¡Listos... ya!', 
                feedback: '¡Atención plena! Cambiará en cualquier milisegundo...', 
                freq: 659.25,
                cls: 'countdown-step-1'
            }
        };

        const tick = () => {
            if (count > 0) {
                const s = steps[count];
                this.pvtBtn.className = `pvt-action-btn state-countdown ${s.cls}`;
                this.pvtIcon.textContent = s.num;
                this.pvtLabel.textContent = s.label;
                this.pvtTimer.textContent = s.timer;
                this.pvtFeedback.textContent = s.feedback;
                this.pvtCounter.textContent = `Iniciando en ${count}s...`;

                if (window.sounds && window.sounds.playNote) {
                    window.sounds.playNote(s.freq, 0.16);
                }
                count--;
                this.countdownTimer = setTimeout(tick, 1000);
            } else {
                this.nextTrial();
            }
        };

        tick();
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
        clearTimeout(this.countdownTimer);
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
        if (this.state === 'COUNTDOWN') {
            return;
        }

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
