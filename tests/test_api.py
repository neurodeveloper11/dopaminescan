"""Integration tests for FastAPI REST API endpoints."""

import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "dopaminescan-engine"


def test_evaluate_endpoint_valid_payload():
    payload = {
        "pvt_reaction_times_ms": [220.5, 235.2, 210.8],
        "pvt_anticipations": 0,
        "gonogo_hits": 6,
        "gonogo_go_total": 6,
        "gonogo_false_alarms": 0,
        "gonogo_nogo_total": 2,
        "gonogo_mean_rt_ms": 290.0,
        "memory_span_correct": 4,
        "memory_span_total": 4,
        "screen_time_hours": 3.0,
    }
    response = client.post("/api/v1/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "dopamine_saturation_index" in data
    assert "attention_half_life_minutes" in data
    assert "archetype_name" in data
    assert "overall_percentile" in data
    assert 0.0 <= data["dopamine_saturation_index"] <= 100.0


def test_evaluate_endpoint_validation_error():
    # Negative screen time should fail Pydantic validation
    invalid_payload = {
        "pvt_reaction_times_ms": [250.0],
        "gonogo_hits": 6,
        "gonogo_false_alarms": 0,
        "memory_span_correct": 4,
        "screen_time_hours": -5.0,  # Invalid
    }
    response = client.post("/api/v1/evaluate", json=invalid_payload)
    assert response.status_code == 422


def test_archetypes_endpoint():
    response = client.get("/api/v1/archetypes")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5


def test_benchmark_endpoint():
    response = client.get("/api/v1/benchmark")
    assert response.status_code == 200
    data = response.json()
    assert "benchmark" in data
    assert data["benchmark"]["mean_dsi"] == 58.4
