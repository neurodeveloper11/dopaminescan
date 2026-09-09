"""Cognitive Archetypes and Population Benchmark distributions for DopamineScan."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class CognitiveArchetype:
    key: str
    name: str
    emoji: str
    dsi_min: float
    dsi_max: float
    color_hex: str
    summary: str
    scientific_profile: str
    recommendation: str


ARCHETYPES: Dict[str, CognitiveArchetype] = {
    "zen_focus": CognitiveArchetype(
        key="zen_focus",
        name="Zen Focus Master",
        emoji="🧘",
        dsi_min=0.0,
        dsi_max=24.9,
        color_hex="#10b981",  # Emerald Neon
        summary="Corteza prefrontal blindada y óptima densidad de receptores D2/D1.",
        scientific_profile=(
            "Control inhibitorio superior en Go/No-Go (d' > 2.8), latencia psicomotora "
            "consistente sin micro-lapsos y retención de memoria de trabajo intacta."
        ),
        recommendation="Mantén tus bloques de trabajo profundo (Deep Work) de 90 minutos y continúa con tus protocolos de desconexión nocturna.",
    ),
    "deep_diver": CognitiveArchetype(
        key="deep_diver",
        name="Deep Diver",
        emoji="🌊",
        dsi_min=25.0,
        dsi_max=44.9,
        color_hex="#06b6d4",  # Cyber Cyan
        summary="Atención selectiva balanceada y resistencia saludable al scroll compulsivo.",
        scientific_profile=(
            "Excelente capacidad de discriminación estimular con impulsividad mínima. "
            "Pequeñas fluctuaciones en tareas de memoria de alta carga visual."
        ),
        recommendation="Programa pausas activas visuales cada 50 minutos para evitar que el cansancio oculomotor afecte tu tiempo de reacción.",
    ),
    "dopamine_nomad": CognitiveArchetype(
        key="dopamine_nomad",
        name="Dopamine Nomad",
        emoji="⚡",
        dsi_min=45.0,
        dsi_max=64.9,
        color_hex="#f59e0b",  # Electric Amber
        summary="Enfoque fragmentado: alta reactividad a la novedad y fatiga atencional media.",
        scientific_profile=(
            "Tiempos de reacción veloces pero aumento en falsas alarmas inhibitorias. "
            "El cerebro busca cambiar de estímulo tras 15-20 minutos de baja estimulación."
        ),
        recommendation="Implementa la regla de 'pantalla en escala de grises' durante jornadas de trabajo para reducir el sesgo atencional por colores vibrantes.",
    ),
    "zombie_scroller": CognitiveArchetype(
        key="zombie_scroller",
        name="Zombie Scroller",
        emoji="🧟‍♂️",
        dsi_min=65.0,
        dsi_max=79.9,
        color_hex="#f97316",  # Intense Orange
        summary="Saturación dopamínica elevada por consumo compulsivo de micro-recompensas.",
        scientific_profile=(
            "Freno inhibitorio notablemente comprometido (fallas frecuentes en No-Go). "
            "Aparición de micro-lapsos en PVT y memoria de trabajo inmediata reducida."
        ),
        recommendation="Ayuno de dopamina digital de 2 horas antes de dormir y dejar el teléfono fuera de la habitación.",
    ),
    "neural_overload": CognitiveArchetype(
        key="neural_overload",
        name="Neural Overload",
        emoji="💥",
        dsi_min=80.0,
        dsi_max=100.0,
        color_hex="#f43f5e",  # Coral Red
        summary="Agotamiento neurocognitivo agudo y saturación crítica del circuito de recompensa.",
        scientific_profile=(
            "Elevada varianza intraindividual en tiempos de reacción (inestabilidad atencional), "
            "alta tasa de respuestas impulsivas anticipadas y degradación temporal del span de memoria."
        ),
        recommendation="Desconexión obligatoria de pantallas durante al menos 24 horas continuas (Digital Detox) y re-establecimiento de ciclos de sueño REM.",
    ),
}

# Empirical benchmark parameters (Normal distribution fitted to 10,000+ simulated digital users)
POPULATION_BENCHMARK = {
    "mean_dsi": 58.4,
    "std_dsi": 16.2,
    "mean_pvt_ms": 284.0,
    "mean_half_life_min": 14.8,
}


def classify_archetype(dsi: float) -> CognitiveArchetype:
    """Finds matching archetype for a given Dopamine Saturation Index."""
    clamped_dsi = max(0.0, min(100.0, dsi))
    for archetype in ARCHETYPES.values():
        if archetype.dsi_min <= clamped_dsi <= archetype.dsi_max:
            return archetype
    # Fallback boundary
    return ARCHETYPES["neural_overload"] if clamped_dsi >= 80.0 else ARCHETYPES["zen_focus"]


def calculate_percentile(dsi: float) -> int:
    """Calculates percentile standing (0-99%) relative to reference population.
    
    Higher percentile means BETTER performance (LOWER dopamine saturation).
    Percentile 85 means user has cleaner attention than 85% of peers.
    """
    import statistics
    clamped_dsi = max(0.0, min(100.0, dsi))
    dist = statistics.NormalDist(mu=POPULATION_BENCHMARK["mean_dsi"], sigma=POPULATION_BENCHMARK["std_dsi"])
    # CDF gives fraction of population with DSI <= user.
    # Since lower DSI is better, our percentile rank is (1 - CDF) * 100
    cdf = dist.cdf(clamped_dsi)
    standing = int(round((1.0 - cdf) * 100.0))
    return max(1, min(99, standing))


def get_all_archetypes() -> List[Dict[str, any]]:
    """Returns serialized list of archetypes for API exposure."""
    return [
        {
            "key": arch.key,
            "name": arch.name,
            "emoji": arch.emoji,
            "dsi_range": [arch.dsi_min, arch.dsi_max],
            "color": arch.color_hex,
            "summary": arch.summary,
            "scientific_profile": arch.scientific_profile,
            "recommendation": arch.recommendation,
        }
        for arch in ARCHETYPES.values()
    ]
