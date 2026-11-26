# Agente de renovaciones (#5 del catálogo)

**Estado: COMPLETADA.** Sin pendientes abiertos. Vertical: correduría (principal), gestoría (secundario).

## Funcionalidad
Un compañero (o el coordinador) pide revisar las renovaciones de un cliente. El agente identifica al cliente por su NIF, consulta
sus pólizas, revisa las que vencen en los próximos 60 días, compara la prima con la oferta de la aseguradora, prepara el correo
para el cliente y crea una tarea humana por cada alerta. No envía nada.

## Decisiones
| # | Decisión |
|---|---|
| R1 | **Por cliente, no por cartera entera.** Un borrador por revisión (el modelo de datos permite un borrador por caso) y el correo es una comunicación coherente al cliente. |
| R2 | **Reactivo.** Los disparadores automáticos (vencimientos a 60 días) quedan fuera de alcance, igual que en el resto de agentes. |
| R3 | **Las alertas las calcula el sistema** (`validation/renewals.py`): subida de prima > 10 %, cobertura reducida, ≥ 2 siniestros en 12 meses y falta de oferta. El modelo no puede recomendar «renovar» una póliza con alertas. |
| R4 | Fecha de referencia = fecha de la solicitud (determinista). Ventana 60 días; urgente ≤ 15 días. |
| R5 | La comisión es información interna (`internal.commission`): no aparece en el correo (guardia en `prepare_email_draft`). |
| R6 | Entorno de datos: clientes y pólizas ficticios sobre la gestoría de la demo (seguros de empresa). No se ha creado un entorno de correduría. |

## Criterios de aceptación (verificados)
- [x] Solo se revisan las pólizas dentro de la ventana; una fuera de ella o de otro cliente se rechaza (`test_renewals.py`).
- [x] Con alertas no se puede recomendar «renovar»; cada alerta crea su incidencia automáticamente y exige su tarea para cerrar.
- [x] No se cierra con pólizas de la ventana sin revisar; un cliente sin vencimientos cierra como `sin_vencimientos` sin inventar trabajo.
- [x] Totales (primas en la ventana 11.870 €, con alertas 7.050 €, urgentes 1) calculados por el sistema y comprobados contra el cálculo independiente.
- [x] El correo no menciona comisiones y se dirige al contacto del cliente; queda como borrador.
- [x] Evals con el modelo real (`tests/evals/test_renewal_evals.py`): 7/7 (principal, sin vencimientos, instrucciones maliciosas ignoradas).
- [x] Coordinador (`test_coordinator_evals.py`): lanza renovaciones con peticiones de vencimientos y sigue sin lanzar nada con peticiones maliciosas.
- [x] Interfaz en español, sin términos técnicos; revisión visual en navegador con ejecución real.

## Escenarios de la demo
`email-renew-martinez` (principal), `email-renew-quiet` (nada que renovar), `email-renew-malicious` (pide saltarse la revisión).
