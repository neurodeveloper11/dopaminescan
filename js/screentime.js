/**
 * Phase 4: Screen Time Exposure Calibration.
 * Single visual question assessing daily digital screen hours.
 */

class ScreenTimePhase {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.initDOM();
    }

    initDOM() {
        this.container.innerHTML = `
            <div class="phase-card screentime-card">
                <div class="phase-header">
                    <span class="badge badge-amber">FASE 4 DE 4</span>
                    <span class="trial-counter">Calibración Final</span>
                </div>
                <h2 class="phase-title">Exposición Diaria a Pantallas</h2>
                <p class="phase-instruction">
                    ¿Cuántas horas pasas al día en tu teléfono (redes, mensajería, ocio digital)?
                </p>

                <div class="screentime-options" id="screentime-options">
                    <button class="screentime-btn" data-hours="1.5" type="button">
                        <span class="st-icon">🧘</span>
                        <div class="st-info">
                            <div class="st-hours">&lt; 2 horas / día</div>
                            <div class="st-desc">Uso mínimo consciente</div>
                        </div>
                    </button>

                    <button class="screentime-btn" data-hours="3.0" type="button">
                        <span class="st-icon">📱</span>
                        <div class="st-info">
                            <div class="st-hours">2 – 4 horas / día</div>
                            <div class="st-desc">Consumo equilibrado</div>
                        </div>
                    </button>

                    <button class="screentime-btn" data-hours="5.0" type="button">
                        <span class="st-icon">⚡</span>
                        <div class="st-info">
                            <div class="st-hours">4 – 6 horas / día</div>
                            <div class="st-desc">Promedio activo de redes</div>
                        </div>
                    </button>

                    <button class="screentime-btn" data-hours="7.0" type="button">
                        <span class="st-icon">🧟</span>
                        <div class="st-info">
                            <div class="st-hours">6 – 8 horas / día</div>
                            <div class="st-desc">Saturación elevada</div>
                        </div>
                    </button>

                    <button class="screentime-btn" data-hours="9.5" type="button">
                        <span class="st-icon">💥</span>
                        <div class="st-info">
                            <div class="st-hours">&gt; 8 horas / día</div>
                            <div class="st-desc">Sobrecarga y fatiga crónica</div>
                        </div>
                    </button>
                </div>

                <div class="phase-footer-feedback">
                    Selecciona en 1 toque para calcular tus resultados
                </div>
            </div>
        `;

        const buttons = this.container.querySelectorAll('.screentime-btn');
        buttons.forEach((btn) => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                window.sounds.playTap();

                const hours = parseFloat(btn.getAttribute('data-hours'));
                setTimeout(() => {
                    if (this.onComplete) {
                        this.onComplete({ screenTimeHours: hours });
                    }
                }, 400);
            });
        });
    }

    start() {
        // Nothing special to initialize
    }
}

window.ScreenTimePhase = ScreenTimePhase;
