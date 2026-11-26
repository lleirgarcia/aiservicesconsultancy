"""Contrato de agente: cómo se describe un agente ante el catálogo, el menú y el coordinador.

Un agente nuevo se añade creando su manifiesto y registrándolo en `registry.py`. Menú, chat y coordinador leen
el catálogo; no conocen a ningún agente concreto.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

Vertical = Literal["gestoria", "correduria"]
Status = Literal["disponible", "proximamente"]


class ImpactConfig(BaseModel):
    """Cómo cuenta el agente su impacto: qué hacía una persona antes y qué le queda ahora, y cómo llama a su unidad de trabajo."""
    unit_singular: str
    unit_plural: str
    manual_steps: list[str] = Field(min_length=1)
    agent_steps: list[str] = Field(min_length=1)
    kpi_processed: str  # etiqueta del primer indicador


class AgentManifest(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9-]{2,40}$")
    name: str = Field(min_length=3, max_length=60)
    # Texto de negocio, sin terminología técnica: es lo que ve el empresario y lo que lee el coordinador.
    summary: str = Field(min_length=10, max_length=200)
    pain: str = Field(min_length=10, max_length=200)
    input_description: str = Field(min_length=5, max_length=200)
    workflow: str = Field(min_length=10, max_length=300)
    output_description: str = Field(min_length=5, max_length=200)
    # Peticiones tal como las escribiría un usuario. Sirven de sugerencias en el chat y de contexto para el coordinador.
    example_requests: list[str] = Field(default_factory=list, max_length=6)
    verticals: dict[Vertical, Literal["principal", "secundario"]] = Field(min_length=1)
    status: Status
    icon: str = "file-text"  # nombre de icono de Lucide
    # Solo agentes disponibles: correo de demo con el que arranca por defecto.
    default_scenario: str | None = None
    impact: ImpactConfig | None = None  # solo agentes disponibles

    @model_validator(mode="after")
    def _available_agents_need_a_scenario(self):
        if self.status == "disponible" and not self.default_scenario:
            raise ValueError("un agente disponible necesita un escenario de demo por defecto")
        if self.status == "proximamente" and self.default_scenario:
            raise ValueError("un agente 'próximamente' no puede tener escenario ejecutable")
        return self
