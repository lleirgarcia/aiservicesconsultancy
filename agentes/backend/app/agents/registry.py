"""Catálogo de agentes. Añadir un agente = añadir su manifiesto aquí."""

from __future__ import annotations

from .manifest import AgentManifest, ImpactConfig

DOCUMENTAL = AgentManifest(
    id="gestion-documental",
    name="Gestión documental",
    summary="Recibe un correo con documentos, los interpreta, comprueba duplicados y deja el expediente organizado.",
    pain="Procesamiento manual de documentación: abrir, leer, clasificar, introducir datos y reclamar lo que falta.",
    input_description="Correo de un cliente con documentos adjuntos.",
    workflow="Interpreta, clasifica, valida, consulta el histórico y detecta duplicados y documentación pendiente.",
    output_description="Expediente organizado, incidencias detectadas y borrador de correo al cliente.",
    example_requests=[
        "Procesa el correo de Construccions Martínez con las facturas de noviembre",
        "Revisa la documentación que ha enviado un cliente y dime qué falta",
    ],
    verticals={"gestoria": "principal", "correduria": "secundario"},
    status="disponible",
    icon="folder-check",
    default_scenario="email-martinez-nov",
    impact=ImpactConfig(
        unit_singular="expediente", unit_plural="expedientes", kpi_processed="Documentos procesados",
        manual_steps=["Abrir correos", "Descargar documentos", "Interpretar facturas", "Introducir datos", "Consultar históricos", "Detectar errores", "Reclamar documentación"],
        agent_steps=["Revisar incidencias", "Validar resultados"]),
)

PRESUPUESTOS = AgentManifest(
    id="presupuestos",
    name="Presupuestos",
    summary="Interpreta una solicitud de un cliente, consulta tarifas, calcula costes y márgenes y prepara el presupuesto.",
    pain="Horas dedicadas a preparar propuestas comerciales.",
    input_description="Solicitud de presupuesto de un cliente.",
    workflow="Interpreta necesidades, consulta tarifas, calcula costes y márgenes y detecta lo que falta.",
    output_description="Presupuesto profesional listo para revisar y enviar.",
    example_requests=["Prepara el presupuesto que ha pedido Construccions Martínez para su sociedad nueva"],
    verticals={"gestoria": "principal", "correduria": "secundario"},
    status="disponible",
    icon="calculator",
    default_scenario="email-quote-martinez",
    impact=ImpactConfig(
        unit_singular="presupuesto", unit_plural="presupuestos", kpi_processed="Líneas del presupuesto",
        manual_steps=["Leer la solicitud", "Buscar las tarifas", "Calcular importes y descuentos", "Comprobar márgenes", "Maquetar el presupuesto", "Redactar el correo"],
        agent_steps=["Revisar lo pendiente", "Validar y enviar"]),
)

COMPARADOR_SEGUROS = AgentManifest(
    id="comparador-seguros",
    name="Comparador de seguros",
    summary="Compara coberturas, exclusiones, franquicias y precios de varias ofertas de aseguradoras.",
    pain="Lectura y comparación manual de pólizas.",
    input_description="Tres ofertas de diferentes aseguradoras.",
    workflow="Compara coberturas, exclusiones, franquicias y precios.",
    output_description="Comparativa visual y propuesta justificada para el corredor.",
    example_requests=["Compara estas tres ofertas de seguro para mi cliente"],
    verticals={"correduria": "principal"},
    status="proximamente",
    icon="scale",
)

SINIESTROS = AgentManifest(
    id="siniestros",
    name="Gestión de siniestros",
    summary="Revisa las condiciones de la póliza, recopila la documentación y prepara la tramitación del siniestro.",
    pain="Tramitación administrativa lenta y expedientes incompletos.",
    input_description="Comunicación de siniestro, póliza y evidencias.",
    workflow="Revisa condiciones, recopila documentación y prepara la tramitación.",
    output_description="Expediente de siniestro listo para revisión.",
    example_requests=["Tramita este siniestro de un cliente"],
    verticals={"correduria": "principal"},
    status="proximamente",
    icon="shield-alert",
)

RENOVACIONES = AgentManifest(
    id="renovaciones",
    name="Renovaciones",
    summary="Detecta vencimientos, revisa las condiciones de renovación y prepara la comunicación al cliente.",
    pain="Pérdida de clientes por falta de seguimiento.",
    input_description="Cartera de clientes y pólizas.",
    workflow="Detecta vencimientos, compara con la oferta de renovación, avisa de subidas y recortes y prepara comunicaciones.",
    output_description="Renovaciones revisadas, ingresos en riesgo identificados y aviso listo para el cliente.",
    example_requests=["Revisa las renovaciones de Construccions Martínez de los próximos 60 días"],
    verticals={"correduria": "principal", "gestoria": "secundario"},
    status="disponible",
    icon="refresh-cw",
    default_scenario="email-renew-martinez",
    impact=ImpactConfig(
        unit_singular="renovación", unit_plural="renovaciones", kpi_processed="Pólizas revisadas",
        manual_steps=["Buscar los vencimientos", "Abrir cada póliza", "Comparar con la oferta de renovación", "Detectar subidas y recortes", "Redactar el aviso al cliente"],
        agent_steps=["Revisar las alertas", "Validar y enviar"]),
)

AUDITOR_FACTURAS = AgentManifest(
    id="auditor-facturas",
    name="Auditor de facturas",
    summary="Cruza facturas, pedidos y albaranes para detectar discrepancias, duplicidades y cobros incorrectos.",
    pain="Errores económicos, duplicidades y cobros incorrectos.",
    input_description="Facturas, pedidos y albaranes de un proveedor.",
    workflow="Cruza cada factura con su pedido y su albarán y detecta duplicadas, precios distintos y cantidades no entregadas.",
    output_description="Informe de anomalías, importe económico en riesgo y reclamación lista para revisar.",
    example_requests=["Audita las facturas de Materials i Àrids del Ter de Construccions Martínez contra sus pedidos y albaranes"],
    verticals={"gestoria": "principal", "correduria": "secundario"},
    status="disponible",
    icon="search-check",
    default_scenario="email-audit-martinez",
    impact=ImpactConfig(
        unit_singular="auditoría", unit_plural="auditorías", kpi_processed="Facturas auditadas",
        manual_steps=["Reunir facturas, pedidos y albaranes", "Cruzar línea a línea", "Comprobar precios y cantidades", "Buscar facturas duplicadas", "Calcular el importe afectado", "Redactar la reclamación"],
        agent_steps=["Revisar las anomalías", "Validar y reclamar"]),
)

AGENTS: list[AgentManifest] = [DOCUMENTAL, PRESUPUESTOS, COMPARADOR_SEGUROS, SINIESTROS, RENOVACIONES, AUDITOR_FACTURAS]

_ids = [a.id for a in AGENTS]
assert len(_ids) == len(set(_ids)), "identificadores de agente duplicados"
AGENTS_BY_ID = {a.id: a for a in AGENTS}


def list_agents(vertical: str | None = None) -> list[AgentManifest]:
    """Catálogo, opcionalmente filtrado por vertical (los principales primero)."""
    if not vertical:
        return list(AGENTS)
    chosen = [a for a in AGENTS if vertical in a.verticals]
    return sorted(chosen, key=lambda a: a.verticals[vertical] != "principal")  # type: ignore[index]
