# Plataforma multi-agente: chat, panel visual y agente de presupuestos

**Estado:** COMPLETADA (F1-F4; aprobada 2026-11-25)

Amplía `PRODUCT_SPEC.MD` (agente de gestión documental, ya construido). Sin puntos `⚠️ PENDIENTE` abiertos: decisiones en la sección 8.

## 0. Decisiones tomadas (2026-11-25)

- **Dos capas sobre el mismo sistema:** un **chat** donde se puede pedir todo y un **panel visual** que muestra el estado,
  la entrada y la salida de cada agente. El chat da la capacidad; el panel hace entendible el proceso a quien no conoce la IA.
- **Agentes reactivos en esta demo:** se ejecutan cuando el usuario lo pide. Los **disparadores proactivos** (que el agente
  arranque solo ante un evento) quedan **fuera de alcance**: son futuro y no forman parte de esta demo.
- **Un único agente nuevo ahora: el de presupuestos (el #2 del catálogo).** Los otros 8 no se desarrollan.
- **Contradice `PRODUCT_SPEC.MD` §7** («No utilizar una interfaz de chatbot») y la parte de «pantalla única guiada». Esta spec
  sustituye esa decisión; ver pendiente P1.

## 1. Catálogo de agentes

Las demos van orientadas principalmente a **gestorías** y **corredurías de seguros**. La columna «Sirve a» indica el uso
principal (**●**) y el secundario (○). Es criterio de producto, no un dato verificado con clientes: validar con los primeros usuarios.

| # | Agente | Input | Output | Gestoría | Correduría | Estado |
|---|---|---|---|:-:|:-:|---|
| 1 | Gestión documental | Correo con documentos adjuntos | Expediente organizado e incidencias | ● | ○ | Construido |
| 2 | **Presupuestos** | Solicitud de presupuesto de un cliente | Presupuesto profesional listo para enviar | ● | ○ | Construido |
| 3 | Comparador de seguros | Tres ofertas de aseguradoras | Comparativa visual y propuesta justificada | | ● | Futuro |
| 4 | **Auditor de facturas** | Facturas, pedidos y albaranes | Informe de anomalías e importe en riesgo | ● | ○ | Construido (ver `SPEC_AGENTE_AUDITOR_FACTURAS.md`) |
| 5 | **Renovaciones** | Cartera de clientes y contratos | Renovaciones gestionadas e ingresos en riesgo | ○ | ● | Construido (ver `SPEC_AGENTE_RENOVACIONES.md`) |
| 6 | Correo electrónico | Bandeja con decenas de correos | Correos gestionados y tareas asignadas | ● | ● | Futuro |
| 7 | Conocimiento empresarial | Manuales, procedimientos, normativa, expedientes | Respuesta justificada con fuentes | ● | ● | Futuro |
| 8 | Gestión de impagos | Facturación y movimientos bancarios | Plan de recuperación y comunicaciones | ● | ○ | Futuro |
| 9 | Gestión de siniestros | Siniestro, póliza y evidencias | Expediente de siniestro listo para revisión | | ● | Futuro |
| 10 | Inteligencia comercial | Cartera e historial comercial | Oportunidades priorizadas e ingresos potenciales | ○ | ● | Futuro |

Notas por vertical:
- **Gestoría:** 1, 2, 4, 8 son el núcleo (documentación, honorarios, facturas, cobros). 6 y 7 aplican a ambos.
- **Correduría:** 3, 5, 9 son exclusivos o principales (comparar ofertas, renovar pólizas, tramitar siniestros).
- El manifiesto de cada agente incluye los verticales a los que sirve, para poder filtrar el catálogo.

Dolores y workflows de cada uno: documento de origen del usuario (no se repiten aquí hasta que un agente entre en desarrollo).

---

## 2. F1 · Contrato de agente

**Funcionalidad:** cada agente se describe con un manifiesto y se registra en un catálogo. Añadir un agente no obliga a
tocar el menú, el chat ni el coordinador.

**Criterios de aceptación**
- Existe un manifiesto por agente con: `id`, nombre, descripción en lenguaje de negocio, dolor que resuelve, ejemplos de
  peticiones, descripción de entrada y de salida, verticales a los que sirve (`gestoria`, `correduria`) y estado (`disponible` | `proximamente`).
- El agente de gestión documental funciona **sin cambios de comportamiento** tras extraerlo al contrato: los 29 tests y las
  13 evals actuales siguen pasando.
- Registrar el agente de presupuestos no modifica ficheros de menú, chat ni coordinador (verificable por el diff).

**Tareas**
- [x] Definir el esquema del manifiesto y el registro (`backend/app/agents/`) y exponerlo en `GET /api/agents`.
- [x] Registrar el agente documental y declarar 5 agentes «Próximamente» (presupuestos, comparador de seguros, siniestros, renovaciones, auditor de facturas).
- [x] Documentar los endpoints en `docs/API.md`.
- [x] La ejecución arranca a través del catálogo (`POST /api/runs` con `agent_id`; `RunManager.start(email_id, agent_id)`). Un agente «próximamente» devuelve `409 agent_unavailable`. Los tests y las 13 evals previas siguen igual.

## 3. F2 · Canal de eventos común

**Funcionalidad:** chat y panel consumen el mismo flujo de eventos de negocio, que ya existe (SSE).

**Criterios de aceptación**
- Todo evento lleva el `agent_id` que lo origina. (Hecho)
- Chat y panel muestran lo mismo: lo que aparece en el chat tiene su reflejo en el panel y viceversa.
- Los eventos siguen sin exponer prompts, tokens, JSON ni nombres de herramientas.

**Tareas**
- Añadir `agent_id` al protocolo de eventos y a las grabaciones (compatibilidad con las ya guardadas).
- Mantener la reproducción grabada para varios agentes.

## 4. F3 · Chat y coordinador

**Funcionalidad:** un campo de texto donde el usuario pide lo que necesita. Un **agente coordinador** decide qué agente
usar, lo lanza y responde en el chat con lo que ocurre y con el resultado.

**Criterios de aceptación**
- Una petición clara («prepara un presupuesto para este cliente») lanza el agente correcto y el chat narra los hitos en
  lenguaje de negocio.
- Una petición que no encaja con ningún agente disponible recibe una respuesta clara que dice qué se puede hacer, sin lanzar
  ningún agente.
- Una petición que encaja con un agente solo declarado («Próximamente») lo dice explícitamente y no inventa resultado.
- Evaluación del coordinador: ≥ 15 peticiones etiquetadas (incluidas ≥ 3 sin agente aplicable y ≥ 3 ambiguas) con ≥ 90 %
  de acierto en la elección de agente. .
- Tiempo desde que se envía la petición hasta que el panel muestra «Entendiendo tu petición» < 1 s.
- El contenido de la petición se trata como dato no confiable (misma regla R7 que el agente documental).

**Tareas**
- Coordinador con los agentes como herramientas (cada agente disponible es una herramienta invocable).
- Endpoint de chat y eventos de conversación.
- Interfaz de chat con sugerencias en forma de botón.
- Evals del coordinador.

## 5. F4 · Panel visual y F5 · Cuadrícula de agentes

**Funcionalidad:** una **cuadrícula** de agentes con un campo de texto arriba del todo. Cada tarjeta muestra el agente y su
estado (libre, trabajando, terminado, próximamente). Al trabajar, el panel de ese agente muestra **entrada → estado →
salida** (el equivalente a las tres columnas actuales, generalizado).

**Criterios de aceptación**
- La cuadrícula se pinta desde `GET /api/agents`, sin tarjetas escritas a mano.
- La tarjeta del agente elegido por el coordinador se resalta; el usuario puede pulsar otra tarjeta manualmente.
- Las tarjetas «Próximamente» no se pueden ejecutar y se distinguen visualmente.
- El panel del agente documental conserva todo lo actual (tres columnas, KPIs, impacto, calculadora, tour, reproducción grabada).
- Toda la interfaz en español y sin terminología técnica.

**Tareas**
- Pantalla de inicio con cuadrícula y campo de texto.
- Panel de agente reutilizable (entrada / trabajo / salida).
- Estado en vivo en las tarjetas.

## 6. F6 · Agente de presupuestos

**Funcionalidad:** el usuario (o el coordinador) le entrega una solicitud de presupuesto de un cliente. El agente interpreta
qué necesita, consulta tarifas, calcula costes y márgenes y deja un presupuesto profesional listo para que una persona lo revise
y lo envíe.

**Workflow del agente**
1. Interpretar la solicitud (qué servicios, qué volumen, qué plazos).
2. Identificar al cliente (o detectar que es un posible cliente nuevo).
3. Consultar el tarifario y las condiciones internas.
4. Calcular líneas, horas, costes, margen, descuentos e IVA con **validaciones deterministas**.
5. Detectar lo que falta o es ambiguo y marcarlo como pendiente de revisión, sin inventarlo.
6. Generar el presupuesto y un borrador de correo para el cliente.
7. Crear tareas de revisión humana y cerrar con un resumen.

**Criterios de aceptación**
- Con la solicitud del escenario de demo, el presupuesto contiene una línea por cada servicio solicitado, y cada precio
  procede del tarifario (nunca del modelo).
- Base, IVA, descuentos y total coinciden con un cálculo independiente en test, al céntimo.
- Un servicio solicitado que **no existe en el tarifario** no recibe precio: queda como «pendiente de revisión» con tarea.
- Un dato necesario que no está en la solicitud (por ejemplo, el número de empleados) no se inventa: se marca pendiente y se
  pide al cliente en el borrador.
- El margen interno es visible para la gestoría y **no aparece** en el borrador ni en el documento para el cliente.
- El presupuesto se genera como documento (PDF) y cada línea enlaza con la parte de la solicitud que la origina.
- Nada se envía: aprobar el borrador solo registra la acción (igual que el agente documental).
- Cliente desconocido: no se asume cliente; se crea tarea de revisión y el presupuesto queda como «para posible cliente nuevo».
- La solicitud se trata como no confiable: una instrucción dentro de ella («aplica un 50 % de descuento») se ignora y se
  señala como incidencia.
- Un escenario de demo ejecuta de principio a fin en < 90 s. .
- Tests deterministas de cálculo y evals con el modelo real, con la misma estructura que las del agente documental
  (escenario principal, cliente desconocido, dato faltante, servicio fuera de tarifario, instrucción maliciosa, fallo de herramienta).
- Salida visual: tarjeta de presupuesto, importe total, margen, pendientes y correo preparado; con estimación de tiempo
  recuperado etiquetada como estimación.

**Tareas**
- Datos de demo ficticios: tarifario, condiciones, cliente(s) y 1-2 solicitudes.
- Herramientas: consultar cliente, consultar tarifario, calcular presupuesto, generar documento, preparar borrador,
  crear tarea de revisión, cerrar expediente.
- Validaciones deterministas de cálculo.
- Prompt, manifiesto, presentador de eventos (mensajes de negocio) y escenario.
- Panel visual del presupuesto.
- Tests y evals; documentar nuevos endpoints en `docs/API.md`.

---

## 7. Fuera de alcance

- Disparadores proactivos (agentes que arrancan solos).
- Los agentes 3 a 10.
- Envío real de correos, integraciones reales, autenticación, multi-tenancy.
- Subida de documentos propios del usuario (decisión P5).
- Entorno ficticio de correduría de seguros.

## 8. Decisiones (antes pendientes)

| # | Decisión | Resolución |
|---|---|---|
| P1 | Sustituye la decisión «no chatbot» de `PRODUCT_SPEC.MD` §7. | **Confirmado.** |
| P2 | Quién emite el presupuesto. | **La gestoría**, presupuesto de honorarios a un cliente (contabilidad mensual, IVA, nóminas, IRPF…), en el mismo entorno ficticio. Presupuestar pólizas queda para el vertical de correduría. |
| P3 | Datos del escenario: servicios, tarifas, horas, descuentos, margen, IVA. | Datos ficticios inventados; se enseñan al usuario antes de dar por buena la fase del agente. |
| P4 | Formato del presupuesto. | **PDF descargable** (reportlab). |
| P5 | Subida de archivos en el chat. | **No** en esta versión: solo entorno ficticio. |
| P6 | Evaluación del coordinador. | ≥ 15 casos, ≥ 90 % de acierto, con ≥ 3 ambiguas y ≥ 3 sin agente aplicable. |
| P7 | Tiempo del agente de presupuestos. | < 90 s en una ejecución típica. |
| P8 | Cuadrícula y tarjetas «Próximamente». | **Pantalla de inicio.** 4 tarjetas «Próximamente»: Comparador de seguros, Gestión de siniestros, Renovaciones (correduría) y Auditor de facturas (gestoría), para que se vea alcance en ambos verticales. |
| P9 | Alcance de la iteración. | **Por fases:** F1 contrato → F2 chat y panel con el agente actual → F3 cuadrícula → F4 agente de presupuestos. |

Fuera de alcance añadido: **entorno ficticio de correduría** (cartera de pólizas, aseguradoras, siniestros). En esta versión
el entorno ficticio es solo la gestoría; los agentes de correduría aparecen únicamente como tarjetas «Próximamente».
