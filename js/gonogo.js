/**
 * Phase 2: Inhibitory Control (Go/No-Go Task).
 * Evaluates the prefrontal impulse brake against compulsive digital actions.
 */

class GoNoGoPhase {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        
        // 8 trials: 6 GO (75%) and 2 NO-GO (25%) - classic paradigm to establish strong motor prepotency
        this.sequence = [
            { type: 'GO', color: '#10b981', label: '¡TOCA!', symbol: '🟢' },
            { type: 'GO', color: '#10b981', label: '¡TOCA!', symbol: '🟢' },
            { type: 'NOGO', color: '#f43f5e', label: '¡FRENA!', symbol: '🛑' },
            { type: 'GO', color: '#10b981', label: '¡TOCA!', symbol: '🟢' },
            { type: 'GO', color: '#10b981', label: '¡TOCA!', symbol: '🟢' },
            { type: 'GO', color: '#10b981', label: '¡TOCA!', symbol: '🟢' },
            { type: 'NOGO', color: '#f43f5e', label: '¡FRENA!', symbol: '🛑' },
            { type: 'GO', color: '#10b981', label: '¡TOCA!', symbol: '🟢' },
        ];

        this.currentIndex = -1;
        this.hits = 0;
        this.goTotal = 6;
        this.falseAlarms = 0;
        this.nogoTotal = 2;
        this.goReactionTimes = [];
        this.trialActive = false;
        this.hasResponded = false;
        this.stimulusTime = 0;

        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="phase-card gonogo-card" id="gonogo-target-zone">
                <div class="phase-header">
                    <span class="badge badge-emerald">FASE 2 DE 4</span>
                    <span class="trial-counter" id="gonogo-counter">Ensayo 1 de 8</span>
                </div>
                <h2 class="phase-title">Freno de Impulsos (Go / No-Go)</h2>
                <p class="phase-instruction">
                    Toca rápido en <span class="text-emerald font-bold">VERDE (🟢)</span>.<br>
                    <strong>¡DETÉN TU DEDO</strong> en <span class="text-coral font-bold">ROJO (🛑)</span>!
                </p>

                <div class="gonogo-arena">
                    <button class="gonogo-target-btn state-ready" id="gonogo-btn" type="button">
                        <div class="gonogo-symbol" id="gonogo-symbol">👆</div>
                        <div class="gonogo-text" id="gonogo-text">¡ESTOY LISTO!</div>
                    </button>
                </div>

                <div class="phase-footer-feedback" id="gonogo-feedback">
                    Lee la regla arriba y toca el botón cuando estés listo
                </div>
            </div>
        `;

        this.gonogoBtn = document.getElementById('gonogo-btn');
        this.gonogoSymbol = document.getElementById('gonogo-symbol');
        this.gonogoText = document.getElementById('gonogo-text');
        this.gonogoFeedback = document.getElementById('gonogo-feedback');
        this.gonogoCounter = document.getElementById('gonogo-counter');
        this.countdownTimer = null;
        this.state = 'IDLE';

        this.gonogoBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handleTap();
        });
    }

    start() {
        this.currentIndex = -1;
        this.hits = 0;
        this.falseAlarms = 0;
        this.goReactionTimes = [];
        this.state = 'READY';

        this.gonogoBtn.className = 'gonogo-target-btn state-ready';
        this.gonogoSymbol.textContent = '👆';
        this.gonogoText.textContent = '¡ESTOY LISTO!';
        this.gonogoFeedback.textContent = 'Lee la regla arriba y toca el botón cuando estés listo';
        this.gonogoFeedback.className = 'phase-footer-feedback';
        this.gonogoCounter.textContent = 'Preparación (8 ensayos)';
    }

    startCountdown() {
        this.state = 'COUNTDOWN';
        this.gonogoBtn.className = 'gonogo-target-btn state-countdown';

        let count = 3;
        const steps = {
            3: { symbol: '3', text: 'PREPÁRATE...', feedback: 'Verde = ¡TOCA! | Rojo = ¡FRENA!', freq: 440 },
            2: { symbol: '2', text: 'ATENTO...', feedback: 'Mantén el pulgar listo', freq: 554.37 },
            1: { symbol: '1', text: '¡CONCÉNTRATE!', feedback: 'Frena el impulso si ves rojo', freq: 659.25 }
        };

        const tick = () => {
            if (count > 0) {
                this.gonogoSymbol.textContent = steps[count].symbol;
                this.gonogoText.textContent = steps[count].text;
                this.gonogoFeedback.textContent = steps[count].feedback;
                this.gonogoFeedback.className = 'phase-footer-feedback text-emerald';
                if (window.sounds && window.sounds.playNote) {
                    window.sounds.playNote(steps[count].freq, 0.15);
                }
                count--;
                this.countdownTimer = setTimeout(tick, 950);
            } else {
                this.state = 'ACTIVE_TEST';
                this.nextTrial();
            }
        };

        tick();
    }

    nextTrial() {
        this.currentIndex++;
        if (this.currentIndex >= this.sequence.length) {
            this.finish();
            return;
        }

        const trial = this.sequence[this.currentIndex];
        this.gonogoCounter.textContent = `Ensayo ${this.currentIndex + 1} de ${this.sequence.length}`;

        // Inter-stimulus blank
        this.trialActive = false;
        this.hasResponded = false;
        this.gonogoBtn.className = 'gonogo-target-btn state-blank';
        this.gonogoSymbol.textContent = '•';
        this.gonogoText.textContent = 'ATENCIÓN';

        setTimeout(() => {
            // Present stimulus
            this.trialActive = true;
            this.stimulusTime = performance.now();

            if (trial.type === 'GO') {
                this.gonogoBtn.className = 'gonogo-target-btn state-go';
                this.gonogoSymbol.textContent = trial.symbol;
                this.gonogoText.textContent = trial.label;
            } else {
                this.gonogoBtn.className = 'gonogo-target-btn state-nogo';
                this.gonogoSymbol.textContent = trial.symbol;
                this.gonogoText.textContent = trial.label;
                window.sounds.playNote(220, 0.08); // warning sub-tone
            }

            // Window of 680ms to respond or withhold
            this.trialTimer = setTimeout(() => {
                if (this.trialActive) {
                    if (trial.type === 'GO' && !this.hasResponded) {
                        // Missed GO
                        this.gonogoFeedback.textContent = 'Demasiado lento en Verde ⏳';
                        this.gonogoFeedback.className = 'phase-footer-feedback text-amber';
                    } else if (trial.type === 'NOGO' && !this.hasResponded) {
                        // Correct Rejection!
                        window.sounds.playTap();
                        this.gonogoFeedback.textContent = '¡Excelente freno inhibitorio! 🛡️';
                        this.gonogoFeedback.className = 'phase-footer-feedback text-emerald';
                    }
                    this.trialActive = false;
                    setTimeout(() => this.nextTrial(), 260);
                }
            }, 680);

        }, 320);
    }

    handleTap() {
        if (this.state === 'READY') {
            if (window.sounds) window.sounds.playTap();
            this.startCountdown();
            return;
        }

        if (this.state === 'COUNTDOWN') return;

        if (!this.trialActive || this.hasResponded) return;

        this.hasResponded = true;
        const rt = Math.round(performance.now() - this.stimulusTime);
        const trial = this.sequence[this.currentIndex];

        if (trial.type === 'GO') {
            this.hits++;
            this.goReactionTimes.push(rt);
            window.sounds.playTap();
            this.gonogoFeedback.textContent = `¡Impacto Go! (${rt} ms) ⚡`;
            this.gonogoFeedback.className = 'phase-footer-feedback text-emerald';
        } else {
            // False alarm / Commission error (impulsive tap on No-Go)
            this.falseAlarms++;
            window.sounds.playFail();
            this.gonogoFeedback.textContent = '¡Falsa alarma! El impulso ganó al freno 🛑';
            this.gonogoFeedback.className = 'phase-footer-feedback text-coral';
            this.gonogoBtn.classList.add('shake-anim');
        }
    }

    finish() {
        clearTimeout(this.trialTimer);
        clearTimeout(this.countdownTimer);
        const meanGoRt = this.goReactionTimes.length
            ? this.goReactionTimes.reduce((a, b) => a + b, 0) / this.goReactionTimes.length
            : 350;

        if (this.onComplete) {
            this.onComplete({
                hits: this.hits,
                goTotal: this.goTotal,
                falseAlarms: this.falseAlarms,
                nogoTotal: this.nogoTotal,
                meanGoRt: Math.round(meanGoRt),
            });
        }
    }
}

window.GoNoGoPhase = GoNoGoPhase;
