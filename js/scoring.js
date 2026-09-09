/**
 * Client-Side Psychometric Scoring Engine for DopamineScan.
 * Exact mathematical alignment with Python backend metrics.py.
 */

const SCORING = {
    // Normal distribution inverse CDF (probit) approximation (Bowling / Abramowitz)
    probit(p) {
        p = Math.max(0.001, Math.min(0.999, p));
        // High-precision Beasley-Springer-Moro / Rational approximation
        const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
        const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
        const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
                   0.02764388103386354, 0.0038405729373609, 0.0003951804142903,
                   0.0000321767881768, 0.0000002888167364, 0.0000003960315187];
        
        const y = p - 0.5;
        if (Math.abs(y) < 0.42) {
            const r = y * y;
            const num = y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]);
            const den = (((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1.0;
            return num / den;
        } else {
            let r = p;
            if (y > 0) r = 1.0 - p;
            r = Math.log(-Math.log(r));
            let val = c[0];
            for (let i = 1; i < c.length; i++) {
                val += c[i] * Math.pow(r, i);
            }
            return y < 0 ? -val : val;
        }
    },

    computeDPrime(hits, totalGo, falseAlarms, totalNoGo) {
        totalGo = Math.max(1, totalGo);
        totalNoGo = Math.max(1, totalNoGo);
        hits = Math.max(0, Math.min(hits, totalGo));
        falseAlarms = Math.max(0, Math.min(falseAlarms, totalNoGo));

        // Hautus log-linear correction
        const hAdj = (hits + 0.5) / (totalGo + 1.0);
        const faAdj = (falseAlarms + 0.5) / (totalNoGo + 1.0);

        const zHit = this.probit(hAdj);
        const zFa = this.probit(faAdj);
        return zHit - zFa;
    },

    calculateAttentionHalfLife(dsi) {
        const clampedDsi = Math.max(0.0, Math.min(100.0, dsi));
        const retention = 1.0 - (clampedDsi / 100.0);
        const halfLife = 45.0 * Math.pow(retention, 1.35) + 3.0;
        return Math.round(halfLife * 10) / 10;
    },

    calculatePercentile(dsi) {
        // Normal distribution CDF for mean=58.4, std=16.2
        const mean = 58.4;
        const std = 16.2;
        const z = (dsi - mean) / std;
        // Error function approx for standard normal CDF
        const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-z * z / 2.0);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        const cdf = z > 0 ? 1.0 - prob : prob;
        
        // Lower DSI is better -> higher percentile standing
        const standing = Math.round((1.0 - cdf) * 100);
        return Math.max(1, Math.min(99, standing));
    },

    classifyArchetype(dsi) {
        const archetypes = [
            {
                key: "zen_focus",
                name: "Zen Focus Master",
                emoji: "🧘",
                min: 0.0,
                max: 24.9,
                color: "#10b981",
                badge: "Corteza de Acero",
                summary: "Corteza prefrontal blindada y óptima densidad de receptores dopamínicos.",
                recommendation: "Mantén tus bloques de trabajo profundo (Deep Work) de 90 minutos."
            },
            {
                key: "deep_diver",
                name: "Deep Diver",
                emoji: "🌊",
                min: 25.0,
                max: 44.9,
                color: "#06b6d4",
                badge: "Atención Óptima",
                summary: "Atención selectiva estable y resistencia saludable al scroll compulsivo.",
                recommendation: "Programa pausas activas visuales cada 50 minutos para refrescar la atención."
            },
            {
                key: "dopamine_nomad",
                name: "Dopamine Nomad",
                emoji: "⚡",
                min: 45.0,
                max: 64.9,
                color: "#f59e0b",
                badge: "Enfoque Ágil",
                summary: "Atención intermitente: alta reactividad a la novedad y fatiga atencional moderada.",
                recommendation: "Aplica escala de grises en el móvil para atenuar estímulos ultra-vibrantes."
            },
            {
                key: "zombie_scroller",
                name: "Zombie Scroller",
                emoji: "🧟‍♂️",
                min: 65.0,
                max: 79.9,
                color: "#f97316",
                badge: "Saturación Alta",
                summary: "Saturación dopamínica elevada por consumo compulsivo de micro-recompensas.",
                recommendation: "Haz ayuno de dopamina digital: cero pantallas 2 horas antes de dormir."
            },
            {
                key: "neural_overload",
                name: "Neural Overload",
                emoji: "💥",
                min: 80.0,
                max: 100.0,
                color: "#f43f5e",
                badge: "Fatiga Crítica",
                summary: "Agotamiento neurocognitivo agudo y sobrecarga en el circuito de recompensa.",
                recommendation: "Detox digital obligatorio de 24 horas y re-sincronización de ciclos circadianos."
            }
        ];

        const clamped = Math.max(0.0, Math.min(100.0, dsi));
        for (const arch of archetypes) {
            if (clamped >= arch.min && clamped <= arch.max) return arch;
        }
        return clamped >= 80 ? archetypes[4] : archetypes[0];
    },

    evaluate(telemetry) {
        // 1. PVT
        const validRts = (telemetry.pvtReactionTimes || []).filter(rt => rt >= 100);
        const meanRt = validRts.length ? validRts.reduce((a, b) => a + b, 0) / validRts.length : 450;
        const rrt = meanRt > 0 ? 1000 / meanRt : 0;
        const lapses = validRts.filter(rt => rt > 500).length;

        const pvtRaw = ((meanRt - 210) / (500 - 210)) * 80;
        const pvtPenalty = ((telemetry.pvtAnticipations || 0) * 8) + (lapses * 12);
        const pvtFatigue = Math.max(0, Math.min(100, pvtRaw + pvtPenalty));

        // 2. Go/No-Go
        const goHits = telemetry.gonogoHits || 0;
        const goTotal = Math.max(1, telemetry.gonogoGoTotal || 6);
        const nogoFa = telemetry.gonogoFalseAlarms || 0;
        const nogoTotal = Math.max(1, telemetry.gonogoNogoTotal || 2);

        const dPrime = this.computeDPrime(goHits, goTotal, nogoFa, nogoTotal);
        const clampedDp = Math.max(-0.5, Math.min(3.5, dPrime));
        const impulseScore = Math.max(0, Math.min(100, ((3.2 - clampedDp) / 3.7) * 100));

        // 3. Memory Span
        const memCorrect = telemetry.memoryCorrect || 0;
        const memTotal = Math.max(1, telemetry.memoryTotal || 4);
        const memAccuracy = Math.max(0, Math.min(1, memCorrect / memTotal));
        const memFatigue = (1.0 - memAccuracy) * 100;

        // 4. Screen Time
        const screenHours = Math.max(0, Math.min(24, telemetry.screenTimeHours || 4.5));
        const screenPenalty = (1.0 - Math.exp(-screenHours / 5.5)) * 100;

        // 5. Consolidated DSI
        const dsiRaw = (0.30 * impulseScore) + (0.30 * pvtFatigue) + (0.20 * memFatigue) + (0.20 * screenPenalty);
        const dsi = Math.round(Math.max(0, Math.min(100, dsiRaw)) * 10) / 10;

        const attentionHalfLife = this.calculateAttentionHalfLife(dsi);
        const archetype = this.classifyArchetype(dsi);
        const percentile = this.calculatePercentile(dsi);

        return {
            pvtMeanRt: Math.round(meanRt),
            pvtRrt: Math.round(rrt * 100) / 100,
            pvtLapses: lapses,
            pvtFatigue: Math.round(pvtFatigue),
            gonogoDPrime: Math.round(dPrime * 100) / 100,
            gonogoImpulseScore: Math.round(impulseScore),
            memoryAccuracy: Math.round(memAccuracy * 100),
            screenHours: screenHours,
            screenPenalty: Math.round(screenPenalty),
            dsi: dsi,
            attentionHalfLife: attentionHalfLife,
            archetype: archetype,
            percentile: percentile,
        };
    }
};

window.SCORING = SCORING;
