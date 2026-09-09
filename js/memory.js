/**
 * Phase 3: Immediate Working Memory Span Task.
 * Evaluates short-term visuospatial retention under rapid information bombardment.
 */

class MemoryPhase {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.gridSize = 9; // 3x3
        this.sequenceLength = 4;
        this.sequence = [];
        this.userSequence = [];
        this.isInputAllowed = false;
        this.tileFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];

        this.initDOM();
    }

    initDOM() {
        let gridHtml = '';
        for (let i = 0; i < this.gridSize; i++) {
            gridHtml += `<button class="memory-tile" data-index="${i}" type="button"></button>`;
        }

        this.container.innerHTML = `
            <div class="phase-card memory-card">
                <div class="phase-header">
                    <span class="badge badge-purple">FASE 3 DE 4</span>
                    <span class="trial-counter" id="mem-counter">Secuencia de 4 pasos</span>
                </div>
                <h2 class="phase-title">Memoria de Trabajo Inmediata</h2>
                <p class="phase-instruction" id="mem-instruction">
                    Observa el patrón luminoso y repítelo en el mismo orden.
                </p>

                <div class="memory-grid" id="memory-grid">
                    ${gridHtml}
                </div>

                <div class="phase-footer-feedback" id="mem-feedback">
                    Memorizando secuencia...
                </div>
            </div>
        `;

        this.gridEl = document.getElementById('memory-grid');
        this.feedbackEl = document.getElementById('mem-feedback');
        this.instructionEl = document.getElementById('mem-instruction');
        this.tiles = Array.from(this.gridEl.querySelectorAll('.memory-tile'));

        this.tiles.forEach((tile) => {
            tile.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                const idx = parseInt(tile.getAttribute('data-index'), 10);
                this.handleTileTap(idx);
            });
        });
    }

    start() {
        this.generateSequence();
        this.feedbackEl.textContent = 'Atención: reproduciendo patrón...';
        this.feedbackEl.className = 'phase-footer-feedback text-purple';
        this.isInputAllowed = false;

        setTimeout(() => this.playSequence(), 800);
    }

    generateSequence() {
        this.sequence = [];
        this.userSequence = [];
        const available = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        for (let i = 0; i < this.sequenceLength; i++) {
            const randIdx = Math.floor(Math.random() * available.length);
            this.sequence.push(available[randIdx]);
        }
    }

    playSequence() {
        let step = 0;
        const interval = setInterval(() => {
            if (step >= this.sequence.length) {
                clearInterval(interval);
                this.enableUserInput();
                return;
            }

            const tileIdx = this.sequence[step];
            this.flashTile(tileIdx, true);
            step++;
        }, 550);
    }

    flashTile(index, playAudio = true) {
        const tile = this.tiles[index];
        if (!tile) return;

        tile.classList.add('tile-active');
        if (playAudio) {
            window.sounds.playNote(this.tileFreqs[index] || 440, 0.18);
        }

        setTimeout(() => {
            tile.classList.remove('tile-active');
        }, 320);
    }

    enableUserInput() {
        this.isInputAllowed = true;
        this.feedbackEl.textContent = '¡Tu turno! Toca las casillas en orden';
        this.feedbackEl.className = 'phase-footer-feedback text-cyan';
        this.instructionEl.innerHTML = `Progreso: <span class="font-bold text-white">0 / ${this.sequenceLength}</span>`;
    }

    handleTileTap(index) {
        if (!this.isInputAllowed) return;

        this.flashTile(index, true);
        this.userSequence.push(index);

        const currentStep = this.userSequence.length - 1;
        this.instructionEl.innerHTML = `Progreso: <span class="font-bold text-white">${this.userSequence.length} / ${this.sequenceLength}</span>`;

        if (this.userSequence.length === this.sequence.length) {
            this.isInputAllowed = false;
            this.evaluateResult();
        }
    }

    evaluateResult() {
        let correctCount = 0;
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.userSequence[i] === this.sequence[i]) {
                correctCount++;
            }
        }

        if (correctCount === this.sequence.length) {
            window.sounds.playSuccess();
            this.feedbackEl.textContent = '¡Patrón perfecto! 100% Retención 🧠✨';
            this.feedbackEl.className = 'phase-footer-feedback text-emerald';
        } else {
            window.sounds.playFail();
            this.feedbackEl.textContent = `Acertaste ${correctCount} de ${this.sequence.length} pasos 📉`;
            this.feedbackEl.className = 'phase-footer-feedback text-amber';
        }

        setTimeout(() => {
            if (this.onComplete) {
                this.onComplete({
                    correct: correctCount,
                    total: this.sequenceLength,
                });
            }
        }, 1200);
    }
}

window.MemoryPhase = MemoryPhase;
