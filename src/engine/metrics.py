"""Psychometric modeling and neurocognitive metrics calculation for DopamineScan.

Formulations:
1. Psychomotor Vigilance Task (PVT): Reciprocal Reaction Time (RRT = 1000 / RT)
   and lapse frequency (RT > 500 ms).
2. Inhibitory Control (Go/No-Go): Signal Detection Theory sensitivity index
   d' = Z(Hit Rate) - Z(False Alarm Rate) with log-linear (Hautus) correction.
3. Working Memory Span: Precision and capacity index.
4. Screen Time Exposure Penalty: Logarithmic/exponential receptor saturation model.
5. Consolidated Dopamine Saturation Index (DSI) and Attention Half-Life.
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass, field
from typing import List


@dataclass
class NeuroTelemetryInput:
    """Raw telemetry collected during a 60-second DopamineScan session."""
    pvt_reaction_times_ms: List[float] = field(default_factory=list)
    pvt_anticipations: int = 0
    gonogo_hits: int = 0
    gonogo_go_total: int = 6
    gonogo_false_alarms: int = 0
    gonogo_nogo_total: int = 2
    gonogo_mean_rt_ms: float = 300.0
    memory_span_correct: int = 4
    memory_span_total: int = 4
    screen_time_hours: float = 4.5


@dataclass
class CognitiveEvaluationResult:
    """Consolidated neurocognitive evaluation results and metrics."""
    pvt_mean_rt_ms: float
    pvt_median_rt_ms: float
    pvt_rrt: float  # Reciprocal reaction time (1000 / RT)
    pvt_lapses: int  # Responses > 500ms
    pvt_fatigue_score: float  # 0 to 100 (higher = worse)
    
    gonogo_hit_rate: float
    gonogo_false_alarm_rate: float
    gonogo_d_prime: float  # Signal detection sensitivity
    gonogo_impulse_score: float  # 0 to 100 (higher = worse inhibition)
    
    memory_accuracy: float  # 0.0 to 1.0
    memory_fatigue_score: float  # 0 to 100
    
    screen_time_hours: float
    screen_time_penalty: float  # 0 to 100
    
    dopamine_saturation_index: float  # 0.0 to 100.0%
    attention_half_life_minutes: float  # Estimated sustained focus duration
    overall_percentile: int  # Percentile vs reference population (0 - 99)
    archetype_key: str
    archetype_name: str
    archetype_emoji: str
    archetype_summary: str


def compute_d_prime(hits: int, total_go: int, false_alarms: int, total_nogo: int) -> float:
    """Computes Signal Detection Theory sensitivity index d' with Hautus (1995) correction.
    
    Hautus correction adds 0.5 to hits and false alarms, and 1.0 to total trials,
    preventing infinite Z scores when hit rate is 1.0 or false alarm rate is 0.0.
    """
    total_go = max(1, total_go)
    total_nogo = max(1, total_nogo)
    hits = max(0, min(hits, total_go))
    false_alarms = max(0, min(false_alarms, total_nogo))

    # Log-linear Hautus correction
    h_adj = (hits + 0.5) / (total_go + 1.0)
    fa_adj = (false_alarms + 0.5) / (total_nogo + 1.0)

    # Clamping within robust normal bounds
    h_adj = min(max(h_adj, 0.001), 0.999)
    fa_adj = min(max(fa_adj, 0.001), 0.999)

    norm = statistics.NormalDist()
    z_hit = norm.inv_cdf(h_adj)
    z_fa = norm.inv_cdf(fa_adj)

    return float(z_hit - z_fa)


def calculate_attention_half_life(dsi: float) -> float:
    """Estimates Attention Half-Life in minutes as an inverse exponential function of DSI.
    
    A clean brain (DSI ~ 10%) exhibits ~45 minutes of continuous focus before distraction impulse.
    A heavily saturated brain (DSI ~ 85%) drops to 3.5 - 5.0 minutes (micro-distraction cycle).
    """
    clamped_dsi = max(0.0, min(100.0, dsi))
    normalized_retention = 1.0 - (clamped_dsi / 100.0)
    half_life = 45.0 * (normalized_retention ** 1.35) + 3.0
    return round(float(half_life), 1)


def calculate_neuro_scores(telemetry: NeuroTelemetryInput) -> CognitiveEvaluationResult:
    """Evaluates raw neurocognitive telemetry and generates holistic cognitive scores."""
    # 1. PVT Psychomotor Metrics
    raw_rts = [rt for rt in telemetry.pvt_reaction_times_ms if rt >= 100.0]
    if not raw_rts:
        # Fallback if no valid RT
        raw_rts = [450.0]
    
    mean_rt = float(statistics.mean(raw_rts))
    median_rt = float(statistics.median(raw_rts))
    rrt = float(1000.0 / mean_rt) if mean_rt > 0 else 0.0
    lapses = sum(1 for rt in raw_rts if rt > 500.0)

    # PVT Fatigue score (0-100):
    # Baseline athlete/young adult RT is ~210ms (score 0). RT of 500ms -> score ~80.
    pvt_raw = (mean_rt - 210.0) / (500.0 - 210.0) * 80.0
    # Add penalty for anticipations and lapses
    pvt_penalty = (telemetry.pvt_anticipations * 8.0) + (lapses * 12.0)
    pvt_fatigue = float(max(0.0, min(100.0, pvt_raw + pvt_penalty)))

    # 2. Go/No-Go Inhibitory Metrics
    go_total = max(1, telemetry.gonogo_go_total)
    nogo_total = max(1, telemetry.gonogo_nogo_total)
    hit_rate = telemetry.gonogo_hits / go_total
    fa_rate = telemetry.gonogo_false_alarms / nogo_total
    d_prime = compute_d_prime(telemetry.gonogo_hits, go_total, telemetry.gonogo_false_alarms, nogo_total)

    # d' typically ranges from -0.5 (chance/reverse) to ~3.5 (near perfect discrimination).
    # d' >= 3.0 -> Impulse Score ~ 0 (maximum control).
    # d' <= 0.5 -> Impulse Score ~ 90+ (compulsive tapping).
    clamped_dp = max(-0.5, min(3.5, d_prime))
    impulse_score = ((3.2 - clamped_dp) / 3.7) * 100.0
    impulse_score = float(max(0.0, min(100.0, impulse_score)))

    # 3. Working Memory Span Metrics
    mem_total = max(1, telemetry.memory_span_total)
    mem_accuracy = float(max(0.0, min(1.0, telemetry.memory_span_correct / mem_total)))
    memory_fatigue = (1.0 - mem_accuracy) * 100.0

    # 4. Screen Time Penalty
    # Baseline healthy non-work leisure phone use: ~1.5h. Heavy exposure: > 8h.
    st_hours = max(0.0, min(24.0, telemetry.screen_time_hours))
    st_penalty = (1.0 - math.exp(-st_hours / 5.5)) * 100.0

    # 5. Consolidated Dopamine Saturation Index (DSI)
    # Weights:
    # - 30% Inhibitory Control (Go/No-Go compulsive friction)
    # - 30% Psychomotor Vigilance (PVT slowing & micro-lapses)
    # - 20% Memory Span Degradation
    # - 20% Screen Time Receptor Downregulation
    dsi_raw = (0.30 * impulse_score) + (0.30 * pvt_fatigue) + (0.20 * memory_fatigue) + (0.20 * st_penalty)
    dsi = round(float(max(0.0, min(100.0, dsi_raw))), 1)

    # 6. Attention Half-Life
    attention_half_life = calculate_attention_half_life(dsi)

    # 7. Archetype and Percentile
    from .archetypes import classify_archetype, calculate_percentile
    archetype = classify_archetype(dsi)
    overall_percentile = calculate_percentile(dsi)

    return CognitiveEvaluationResult(
        pvt_mean_rt_ms=round(mean_rt, 1),
        pvt_median_rt_ms=round(median_rt, 1),
        pvt_rrt=round(rrt, 2),
        pvt_lapses=lapses,
        pvt_fatigue_score=round(pvt_fatigue, 1),
        gonogo_hit_rate=round(hit_rate, 2),
        gonogo_false_alarm_rate=round(fa_rate, 2),
        gonogo_d_prime=round(d_prime, 2),
        gonogo_impulse_score=round(impulse_score, 1),
        memory_accuracy=round(mem_accuracy, 2),
        memory_fatigue_score=round(memory_fatigue, 1),
        screen_time_hours=round(st_hours, 1),
        screen_time_penalty=round(st_penalty, 1),
        dopamine_saturation_index=dsi,
        attention_half_life_minutes=attention_half_life,
        overall_percentile=overall_percentile,
        archetype_key=archetype.key,
        archetype_name=archetype.name,
        archetype_emoji=archetype.emoji,
        archetype_summary=archetype.summary,
    )
