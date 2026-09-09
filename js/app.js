/**
 * DopamineScan Main Application Controller & State Machine.
 * Coordinates 60-second assessment phases, audio feedback, and viral reporting.
 */

document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        intro: document.getElementById('screen-intro'),
        stage: document.getElementById('screen-stage'),
        results: document.getElementById('screen-results'),
    };

    const progressBar = document.getElementById('progress-bar-fill');
    const stageContainer = document.getElementById('stage-container');
    const muteBtn = document.getElementById('mute-toggle-btn');
    const muteIcon = document.getElementById('mute-icon');

    // Telemetry state
    let sessionTelemetry = {
        pvtReactionTimes: [],
        pvtAnticipations: 0,
        gonogoHits: 0,
        gonogoGoTotal: 6,
        gonogoFalseAlarms: 0,
        gonogoNogoTotal: 2,
        gonogoMeanRt: 300,
        memoryCorrect: 4,
        memoryTotal: 4,
        screenTimeHours: 4.5,
    };

    let evaluationResult = null;

    // Theme toggle setup (Master Solution: Dark OLED default with quick switch to Blanco Grisáceo)
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('dopaminescan_theme', theme);
        } catch (e) {}

        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
            if (themeBtn) {
                themeBtn.setAttribute('title', theme === 'light' ? 'Cambiar a modo oscuro (Dark OLED)' : 'Cambiar a modo blanco grisáceo');
                themeBtn.setAttribute('aria-label', theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo blanco grisáceo');
            }
        }

        // If results preview is active, re-render card in matching theme
        const previewCanvas = document.getElementById('card-preview-canvas');
        if (previewCanvas && evaluationResult && window.CanvasCardGenerator) {
            window.CanvasCardGenerator.render(evaluationResult, previewCanvas, theme);
        }
    }

    let savedTheme = 'dark';
    try {
        savedTheme = localStorage.getItem('dopaminescan_theme') || 'dark';
    } catch (e) {}
    applyTheme(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            window.sounds.playTap();
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    // Audio mute toggle
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const isMuted = window.sounds.toggleMute();
            muteIcon.textContent = isMuted ? '🔇' : '🔊';
            muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
        });
    }

    // Start Button
    const startBtn = document.getElementById('btn-start-test');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.sounds.playTap();
            showScreen('stage');
            runPhase1();
        });
    }

    function showScreen(screenKey) {
        Object.keys(screens).forEach(key => {
            screens[key].classList.remove('active-screen');
        });
        screens[screenKey].classList.add('active-screen');
    }

    function setProgress(percent) {
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }

    // Phase 1: PVT
    function runPhase1() {
        setProgress(15);
        const pvt = new window.PVTPhase(stageContainer, (data) => {
            sessionTelemetry.pvtReactionTimes = data.reactionTimes;
            sessionTelemetry.pvtAnticipations = data.anticipations;
            runPhase2();
        });
        pvt.start();
    }

    // Phase 2: Go/No-Go
    function runPhase2() {
        setProgress(45);
        const gonogo = new window.GoNoGoPhase(stageContainer, (data) => {
            sessionTelemetry.gonogoHits = data.hits;
            sessionTelemetry.gonogoGoTotal = data.goTotal;
            sessionTelemetry.gonogoFalseAlarms = data.falseAlarms;
            sessionTelemetry.gonogoNogoTotal = data.nogoTotal;
            sessionTelemetry.gonogoMeanRt = data.meanGoRt;
            runPhase3();
        });
        gonogo.start();
    }

    // Phase 3: Memory Span
    function runPhase3() {
        setProgress(70);
        const memory = new window.MemoryPhase(stageContainer, (data) => {
            sessionTelemetry.memoryCorrect = data.correct;
            sessionTelemetry.memoryTotal = data.total;
            runPhase4();
        });
        memory.start();
    }

    // Phase 4: Screen Time
    function runPhase4() {
        setProgress(90);
        const screentime = new window.ScreenTimePhase(stageContainer, (data) => {
            sessionTelemetry.screenTimeHours = data.screenTimeHours;
            finalizeAndShowResults();
        });
        screentime.start();
    }

    // Finalize Results
    function finalizeAndShowResults() {
        setProgress(100);
        evaluationResult = window.SCORING.evaluate(sessionTelemetry);

        showScreen('results');
        window.sounds.playFanfare();

        renderResultsDOM(evaluationResult);
    }

    function renderResultsDOM(res) {
        const arch = res.archetype;

        // Metric Values
        document.getElementById('res-dsi-value').textContent = `${res.dsi}%`;
        document.getElementById('res-arch-emoji').textContent = arch.emoji;
        document.getElementById('res-arch-name').textContent = arch.name;
        document.getElementById('res-arch-badge').textContent = arch.badge;
        document.getElementById('res-arch-summary').textContent = arch.summary;
        document.getElementById('res-arch-rec').textContent = arch.recommendation;

        document.getElementById('res-half-life').textContent = `${res.attentionHalfLife} min`;
        document.getElementById('res-pvt-rt').textContent = `${res.pvtMeanRt} ms`;
        document.getElementById('res-gonogo-dp').textContent = `${res.gonogoDPrime} d'`;
        document.getElementById('res-percentile').textContent = `Top ${100 - res.percentile}%`;

        // Color theme
        const meter = document.getElementById('dsi-circle-meter');
        if (meter) {
            meter.style.borderColor = arch.color;
            meter.style.boxShadow = `0 0 40px ${arch.color}33`;
        }

        // Live preview of Canvas Story Card
        const previewCanvas = document.getElementById('card-preview-canvas');
        if (previewCanvas) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            window.CanvasCardGenerator.render(res, previewCanvas, currentTheme);
        }

        // Action Handlers
        const btnDownload = document.getElementById('btn-download-card');
        const btnShare = document.getElementById('btn-share-card');
        const btnCopyChallenge = document.getElementById('btn-copy-challenge');
        const btnRestart = document.getElementById('btn-restart-test');

        if (btnDownload) {
            btnDownload.onclick = (e) => {
                e.preventDefault();
                window.sounds.playTap();
                window.CanvasCardGenerator.download(res);
            };
        }

        if (btnShare) {
            btnShare.onclick = (e) => {
                e.preventDefault();
                window.sounds.playTap();
                window.CanvasCardGenerator.share(res);
            };
        }

        if (btnCopyChallenge) {
            btnCopyChallenge.onclick = async (e) => {
                e.preventDefault();
                window.sounds.playTap();
                const text = window.CanvasCardGenerator.getChallengeText(res);
                try {
                    await navigator.clipboard.writeText(text);
                    btnCopyChallenge.textContent = '¡Copiado! 📋✨';
                    setTimeout(() => {
                        btnCopyChallenge.textContent = 'Copiar Reto 📋';
                    }, 2500);
                } catch (err) {
                    prompt('Copia tu reto:', text);
                }
            };
        }

        if (btnRestart) {
            btnRestart.onclick = (e) => {
                e.preventDefault();
                window.sounds.playTap();
                showScreen('intro');
                setProgress(0);
            };
        }
    }
});
