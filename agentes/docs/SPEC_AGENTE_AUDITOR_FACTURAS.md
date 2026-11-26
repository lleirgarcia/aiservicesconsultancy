# Agente auditor de facturas (#4 del catálogo)

**Estado: COMPLETADA.** Sin pendientes abiertos. Vertical: gestoría (principal), correduría (secundario).

## Funcionalidad
Un compañero (o el coordinador) pide auditar las facturas de un proveedor de un cliente. El agente identifica al cliente por su NIF,
cruza cada factura con su pedido y sus albaranes, calcula el importe afectado por anomalías, prepara el correo para el cliente y crea
una tarea humana por cada anomalía. No envía ni paga nada.

## Decisiones
| # | Decisión |
|---|---|
| A1 | **Por proveedor y cliente.** Un borrador por auditoría y un informe coherente. El destinatario sale de la ficha del cliente: el modelo no lo elige. |
| A2 | **Reactivo**, como el resto de agentes; la auditoría periódica automática queda fuera de alcance. |
| A3 | **El cruce lo calcula el sistema** (`validation/audit.py`): duplicada, sin pedido, concepto no pedido, precio superior al pedido, cantidad no entregada y error aritmético. El modelo no puede recomendar «pagar» una factura con anomalías. |
| A4 | Importes en base imponible; el IVA (21 %) se informa aparte. Un precio inferior al pedido no es anomalía (no hay riesgo económico). |
| A5 | Datos de demostración propios (facturas, pedidos y albaranes ficticios) sobre clientes y proveedores ya existentes. Los documentos son registros de datos (no PDF ni imágenes): la lectura de documentos es cosa del agente de gestión documental. |
| A6 | No se cierra con facturas del proveedor sin auditar ni con incidencias sin tarea. |

## Criterios de aceptación (verificados)
- [x] Cada tipo de anomalía se detecta con el importe exacto en pruebas unitarias y sobre el escenario principal (`test_audit.py`): 130 € de sobreprecio, 228 € no entregados, 1.749 € duplicados y 2.100 € sin pedido = 4.207 € sin IVA (5.090,47 € con IVA).
- [x] Con anomalías no se puede «pagar»; una factura de otro cliente o proveedor se rechaza.
- [x] No se cierra con facturas sin auditar ni sin tarea por incidencia.
- [x] Un proveedor sin anomalías cierra con 0 € afectados sin inventar problemas.
- [x] Evals con el modelo real (`tests/evals/test_audit_evals.py`): principal, proveedor limpio e instrucciones maliciosas ignoradas.
- [x] Coordinador: lanza el auditor con peticiones de auditoría y sigue sin lanzar nada con peticiones maliciosas.
- [x] Interfaz en español, sin términos técnicos; revisión visual en navegador con ejecución real.

## Escenarios de la demo
`email-audit-martinez` (principal), `email-audit-quiet` (todo cuadra), `email-audit-malicious` (pide saltarse el cruce).
