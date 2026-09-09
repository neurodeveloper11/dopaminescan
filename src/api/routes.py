"""FastAPI REST routes for DopamineScan."""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, HTTPException, status

from .schemas import (
    TelemetryPayload,
    CognitiveScoreResponse,
    ArchetypeInfo,
    HealthCheckResponse,
)
from ..engine.metrics import NeuroTelemetryInput, calculate_neuro_scores
from ..engine.archetypes import get_all_archetypes, ARCHETYPES, POPULATION_BENCHMARK

router = APIRouter(prefix="/api/v1", tags=["Evaluation"])


@router.post(
    "/evaluate",
    response_model=CognitiveScoreResponse,
    summary="Evaluate Session Telemetry",
    description="Processes raw telemetry from PVT, Go/No-Go, Memory Span, and Screen Time to compute cognitive scores and archetype.",
)
async def evaluate_session(payload: TelemetryPayload) -> CognitiveScoreResponse:
    try:
        telemetry = NeuroTelemetryInput(
            pvt_reaction_times_ms=payload.pvt_reaction_times_ms,
            pvt_anticipations=payload.pvt_anticipations,
            gonogo_hits=payload.gonogo_hits,
            gonogo_go_total=payload.gonogo_go_total,
            gonogo_false_alarms=payload.gonogo_false_alarms,
            gonogo_nogo_total=payload.gonogo_nogo_total,
            gonogo_mean_rt_ms=payload.gonogo_mean_rt_ms,
            memory_span_correct=payload.memory_span_correct,
            memory_span_total=payload.memory_span_total,
            screen_time_hours=payload.screen_time_hours,
        )
        result = calculate_neuro_scores(telemetry)
        archetype_obj = ARCHETYPES.get(result.archetype_key)
        recommendation = archetype_obj.recommendation if archetype_obj else ""

        return CognitiveScoreResponse(
            pvt_mean_rt_ms=result.pvt_mean_rt_ms,
            pvt_median_rt_ms=result.pvt_median_rt_ms,
            pvt_rrt=result.pvt_rrt,
            pvt_lapses=result.pvt_lapses,
            pvt_fatigue_score=result.pvt_fatigue_score,
            gonogo_hit_rate=result.gonogo_hit_rate,
            gonogo_false_alarm_rate=result.gonogo_false_alarm_rate,
            gonogo_d_prime=result.gonogo_d_prime,
            gonogo_impulse_score=result.gonogo_impulse_score,
            memory_accuracy=result.memory_accuracy,
            memory_fatigue_score=result.memory_fatigue_score,
            screen_time_hours=result.screen_time_hours,
            screen_time_penalty=result.screen_time_penalty,
            dopamine_saturation_index=result.dopamine_saturation_index,
            attention_half_life_minutes=result.attention_half_life_minutes,
            overall_percentile=result.overall_percentile,
            archetype_key=result.archetype_key,
            archetype_name=result.archetype_name,
            archetype_emoji=result.archetype_emoji,
            archetype_summary=result.archetype_summary,
            recommendation=recommendation,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error evaluating cognitive telemetry: {str(exc)}",
        ) from exc


@router.get(
    "/archetypes",
    response_model=List[ArchetypeInfo],
    summary="List Cognitive Archetypes",
    description="Returns the taxonomy of 5 neurocognitive archetypes, score ranges, and recommendations.",
)
async def list_archetypes() -> List[ArchetypeInfo]:
    return [ArchetypeInfo(**arch) for arch in get_all_archetypes()]


@router.get(
    "/benchmark",
    summary="Population Benchmark Data",
    description="Returns distribution parameters (mean, standard deviation) for global comparative benchmarking.",
)
async def get_benchmark():
    return {
        "benchmark": POPULATION_BENCHMARK,
        "sample_size": 10000,
        "methodology": "Simulated empirical calibration curve based on digital-native normative cohorts.",
    }
