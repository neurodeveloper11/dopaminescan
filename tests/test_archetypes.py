"""Tests for archetype classification and normative percentile calculation."""

import pytest
from src.engine.archetypes import (
    ARCHETYPES,
    classify_archetype,
    calculate_percentile,
    get_all_archetypes,
)


@pytest.mark.parametrize(
    "dsi,expected_key",
    [
        (0.0, "zen_focus"),
        (15.5, "zen_focus"),
        (24.9, "zen_focus"),
        (25.0, "deep_diver"),
        (38.0, "deep_diver"),
        (44.9, "deep_diver"),
        (45.0, "dopamine_nomad"),
        (55.2, "dopamine_nomad"),
        (64.9, "dopamine_nomad"),
        (65.0, "zombie_scroller"),
        (72.1, "zombie_scroller"),
        (79.9, "zombie_scroller"),
        (80.0, "neural_overload"),
        (92.4, "neural_overload"),
        (100.0, "neural_overload"),
        (-5.0, "zen_focus"),  # Out of bounds lower clamp
        (105.0, "neural_overload"),  # Out of bounds upper clamp
    ],
)
def test_classify_archetype_boundaries(dsi, expected_key):
    archetype = classify_archetype(dsi)
    assert archetype.key == expected_key


def test_percentile_calculation():
    # Lower DSI is better, meaning higher percentile rank
    top_percentile = calculate_percentile(20.0)
    avg_percentile = calculate_percentile(58.4)
    low_percentile = calculate_percentile(85.0)

    assert top_percentile > avg_percentile > low_percentile
    assert 45 <= avg_percentile <= 55
    assert top_percentile >= 95
    assert low_percentile <= 10


def test_get_all_archetypes_list():
    archetypes = get_all_archetypes()
    assert len(archetypes) == 5
    keys = [a["key"] for a in archetypes]
    assert "zen_focus" in keys
    assert "zombie_scroller" in keys
