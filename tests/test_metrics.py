"""Unit tests for psychometric metrics calculation and edge cases."""

import pytest
from src.engine.metrics import (
    NeuroTelemetryInput,
    compute_d_prime,
    calculate_attention_half_life,
    calculate_neuro_scores,
)


def test_d_prime_calculation_perfect_discrimination():
    """Near-perfect hits with zero false alarms should yield high d' (> 2.0)."""
    dp = compute_d_prime(hits=6, total_go=6, false_alarms=0, total_nogo=2)
    assert dp > 2.0
    assert dp < 4.0


def test_d_prime_calculation_chance_discrimination():
    """Equal hit and false alarm rates should yield d' near 0."""
    dp = compute_d_prime(hits=3, total_go=6, false_alarms=1, total_nogo=2)
    assert abs(dp) < 0.8


def test_d_prime_bounds_and_extremes():
    """d' handles 0 hits, all false alarms, and negative boundaries without throwing."""
    dp_worst = compute_d_prime(hits=0, total_go=6, false_alarms=2, total_nogo=2)
    assert dp_worst < 0.0

    # Total zeros safe guard
    dp_zero = compute_d_prime(hits=0, total_go=0, false_alarms=0, total_nogo=0)
    assert isinstance(dp_zero, float)


def test_attention_half_life_decay_curve():
    """Attention Half-Life decreases monotonically as DSI increases."""
    zen_half_life = calculate_attention_half_life(10.0)
    zombie_half_life = calculate_attention_half_life(75.0)
    overload_half_life = calculate_attention_half_life(95.0)

    assert zen_half_life > zombie_half_life > overload_half_life
    assert 35.0 <= zen_half_life <= 48.0
    assert 3.0 <= overload_half_life <= 6.0


def test_calculate_neuro_scores_optimal_profile():
    """Ideal user should produce low DSI (< 25%), long attention half life, and Zen Master archetype."""
    telemetry = NeuroTelemetryInput(
        pvt_reaction_times_ms=[205.0, 212.0, 218.0],
        pvt_anticipations=0,
        gonogo_hits=6,
        gonogo_go_total=6,
        gonogo_false_alarms=0,
        gonogo_nogo_total=2,
        gonogo_mean_rt_ms=260.0,
        memory_span_correct=4,
        memory_span_total=4,
        screen_time_hours=1.5,
    )
    result = calculate_neuro_scores(telemetry)

    assert 0.0 <= result.dopamine_saturation_index <= 25.0
    assert result.archetype_key == "zen_focus"
    assert result.pvt_lapses == 0
    assert result.pvt_rrt > 4.5
    assert result.attention_half_life_minutes > 35.0
    assert result.overall_percentile >= 90


def test_calculate_neuro_scores_severe_saturation():
    """Heavily distracted/fatigued profile should yield high DSI (> 75%) and Zombie/Overload archetype."""
    telemetry = NeuroTelemetryInput(
        pvt_reaction_times_ms=[520.0, 610.0, 490.0],
        pvt_anticipations=2,
        gonogo_hits=4,
        gonogo_go_total=6,
        gonogo_false_alarms=2,
        gonogo_nogo_total=2,
        gonogo_mean_rt_ms=480.0,
        memory_span_correct=1,
        memory_span_total=4,
        screen_time_hours=10.0,
    )
    result = calculate_neuro_scores(telemetry)

    assert result.dopamine_saturation_index >= 70.0
    assert result.archetype_key in ("zombie_scroller", "neural_overload")
    assert result.pvt_lapses >= 2
    assert result.attention_half_life_minutes < 10.0
    assert result.overall_percentile <= 25


def test_calculate_neuro_scores_empty_or_invalid_pvt():
    """Gracefully handles empty RT list or extreme outliers."""
    telemetry = NeuroTelemetryInput(
        pvt_reaction_times_ms=[],
        pvt_anticipations=3,
        gonogo_hits=5,
        gonogo_go_total=6,
        gonogo_false_alarms=1,
        gonogo_nogo_total=2,
        memory_span_correct=3,
        memory_span_total=4,
        screen_time_hours=5.0,
    )
    result = calculate_neuro_scores(telemetry)
    assert 0.0 <= result.dopamine_saturation_index <= 100.0
    assert result.pvt_mean_rt_ms > 0
