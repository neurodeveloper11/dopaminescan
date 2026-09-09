"""Pydantic schemas for request validation and API serialization."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class TelemetryPayload(BaseModel):
    """Client-side session telemetry collected across the 4 assessment phases."""
    pvt_reaction_times_ms: List[float] = Field(
        ...,
        description="Measured psychomotor reaction times in ms (typically 3 trials).",
        examples=[[215.4, 230.1, 245.8]],
    )
    pvt_anticipations: int = Field(
        default=0,
        ge=0,
        description="False starts / premature taps before the visual stimulus.",
    )
    gonogo_hits: int = Field(
        ...,
        ge=0,
        description="Successful taps on Go (green) stimuli.",
        examples=[6],
    )
    gonogo_go_total: int = Field(
        default=6,
        ge=1,
        description="Total Go stimuli presented in sequence.",
    )
    gonogo_false_alarms: int = Field(
        ...,
        ge=0,
        description="Uninhibited taps on No-Go (red) stimuli.",
        examples=[1],
    )
    gonogo_nogo_total: int = Field(
        default=2,
        ge=1,
        description="Total No-Go stimuli presented in sequence.",
    )
    gonogo_mean_rt_ms: float = Field(
        default=320.0,
        ge=50.0,
        description="Mean reaction time on Go hits.",
    )
    memory_span_correct: int = Field(
        ...,
        ge=0,
        description="Correct items recalled in immediate visual memory sequence.",
        examples=[4],
    )
    memory_span_total: int = Field(
        default=4,
        ge=1,
        description="Total items in memory sequence.",
    )
    screen_time_hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Self-reported daily screen time in hours.",
        examples=[5.5],
    )


class CognitiveScoreResponse(BaseModel):
    """Detailed score response from the neurocognitive engine."""
    pvt_mean_rt_ms: float
    pvt_median_rt_ms: float
    pvt_rrt: float
    pvt_lapses: int
    pvt_fatigue_score: float

    gonogo_hit_rate: float
    gonogo_false_alarm_rate: float
    gonogo_d_prime: float
    gonogo_impulse_score: float

    memory_accuracy: float
    memory_fatigue_score: float

    screen_time_hours: float
    screen_time_penalty: float

    dopamine_saturation_index: float
    attention_half_life_minutes: float
    overall_percentile: int
    archetype_key: str
    archetype_name: str
    archetype_emoji: str
    archetype_summary: str
    recommendation: str


class ArchetypeInfo(BaseModel):
    key: str
    name: str
    emoji: str
    dsi_range: List[float]
    color: str
    summary: str
    scientific_profile: str
    recommendation: str


class HealthCheckResponse(BaseModel):
    status: str
    version: str
    service: str
