# API HTTP de Kroomix

Inventario de todos los endpoints. Código: `backend/app/api/main.py`. Si se crea, modifica o elimina un endpoint, este
fichero se actualiza en la misma operación.

- **Base URL:** `http://127.0.0.1:${BASE_PORT}` (`BASE_PORT` lo asigna `port-allocator`; 15600 en este proyecto). El mismo
  servidor sirve el frontend compilado (`frontend/dist`) en `/` y la API en `/api/*`.
- **Auth:** sesión por cookie (`kroomix_session`, `HttpOnly`, `SameSite=Lax`, `Secure` si la petición llega por HTTPS). Todo
  `/api/*` exige sesión salvo `POST /api/auth/login` y `GET /api/health` (sin sesión → `401 unauthenticated`). `/api/admin/*`
  exige rol `admin` (`403 forbidden`). La bandeja de correo (`/api/inbox*`) solo funciona para `admin`: a un cliente le devuelve
  vacía/`403`. El servidor escucha solo en `127.0.0.1`: para abrirlo a clientes hay que publicarlo detrás de un proxy con HTTPS
  (y `KROOMIX_TRUST_PROXY=1`). **En producción** el único acceso es `www.kroomix.com`: `POST /api/demos-login` (Next) valida usuario y contraseña contra `POST /api/auth/login` de este backend y emite la cookie `kroomix_session`; `src/proxy.ts` reenvía `/agentes-app/*` añadiendo `x-agentes-key` (`AGENTES_SECRET`). Más abajo, «Acceso y trazabilidad».
- **Trazabilidad:** cada petición a `/api/*` de un usuario con sesión se guarda en la tabla `activity` (usuario, hora, IP, ruta,
  estado, duración, cuerpo de petición y —en POST/PUT— de respuesta, truncados a 4 KB, con campos `pass*`/`secret*`/`token*`
  ocultados). No se registran `GET /api/health`, `GET /api/inbox` (sondeo) ni `/api/admin/*`.
- **CORS:** no hay cabeceras CORS. Frontend y API comparten origen. En desarrollo, Vite hace de proxy.
- **Formato de error:** `{"detail": {"error": "<código>", "message": "<texto en castellano>"}}`. Los errores de validación
  de FastAPI (422) usan el formato estándar `{"detail": [{"type", "loc", "msg", "input"}]}`.
- **Correos:** el sistema **nunca envía correos**. Aprobar un borrador solo registra la acción en la base de datos
  (`sent` es siempre `false`).
- **Variables de entorno que afectan a toda la API:**

| Variable | Defecto | Efecto |
|---|---|---|
| `KROOMIX_DB` | `backend/data/kroomix.db` | Base de datos SQLite. Para probar, apuntar a una copia. |
| `KROOMIX_DATA_DIR` | `backend/data` | Carpeta de datos y ficheros (`files/`). |
| `KROOMIX_MODEL` | `sonnet` | Modelo del agente. |
| `KROOMIX_AI_PROVIDER` | `claude-agent-sdk` | Adaptador de IA (el único implementado). |
| `KROOMIX_EFFORT` | `medium` | Esfuerzo de razonamiento del modelo. |
| `KROOMIX_QUOTE_MANUAL_MINUTES` / `KROOMIX_QUOTE_REVIEW_MINUTES` | `45` / `5` | Hipótesis comerciales del agente de presupuestos (estimaciones, no mediciones). |
| `KROOMIX_RENEWAL_MANUAL_MINUTES` / `KROOMIX_RENEWAL_REVIEW_MINUTES` | `40` / `8` | Hipótesis comerciales del agente de renovaciones (estimaciones, no mediciones). |
| `KROOMIX_AUDIT_MANUAL_MINUTES` / `KROOMIX_AUDIT_REVIEW_MINUTES` | `60` / `10` | Hipótesis comerciales del agente auditor de facturas (estimaciones, no mediciones). |
| `KROOMIX_QUOTES_DIR` | `backend/data/files/quotes` | Carpeta de los PDF de presupuesto generados (los tests la redirigen a una temporal). |
| `KROOMIX_COORDINATOR_MODEL` | `haiku` | Modelo del coordinador del chat (solo decide qué agente usar; no admite `effort`). |
| `KROOMIX_MAX_TURNS` | `60` | Tope de turnos del agente por ejecución. |
| `KROOMIX_RUN_TIMEOUT_S` | `420` | Tiempo máximo de una ejecución. Al superarlo termina con `status="error"`. |
| `KROOMIX_MAX_EXTRACTION_ATTEMPTS` | `3` | Reintentos de extracción por documento antes de derivarlo a revisión. |
| `KROOMIX_MANUAL_MINUTES` / `KROOMIX_REVIEW_MINUTES` | `15` / `2` | Hipótesis comerciales (estimaciones, no mediciones). |
| `KROOMIX_SESSION_TTL_H` | `12` | Horas de validez de una sesión. En prod, `168` (igual que la cookie de la web). |
| `KROOMIX_LOGIN_MAX_FAILURES` | `5` | Intentos fallidos por usuario (15 min) antes de bloquear el inicio de sesión (`429`). |
| `KROOMIX_TRUST_PROXY` | vacío | `1` = fiarse de `X-Forwarded-For`/`X-Forwarded-Proto` (detrás de un proxy TLS) para la IP y la cookie `Secure`. |
| `KROOMIX_USD_EUR` | `0.92` | Tipo de cambio fijo para mostrar el coste de IA en euros (estimación, no cotización). |
| `KROOMIX_FAULTS` | `{}` | JSON `{"herramienta": n}`: las n primeras llamadas a esa herramienta fallan (para evals). |

**Correos de la demo del agente documental** (`email_id`): `email-martinez-nov` (escenario principal, valor por defecto), `email-roca-nov`
(foto ilegible), `email-comas-nov` (instrucciones maliciosas en el correo y en el documento), `email-unknown`
(remitente que no es cliente).

**Solicitudes de presupuesto de la demo** (agente `presupuestos`): `email-quote-martinez` (principal: 5 servicios del tarifario y uno fuera de él), `email-quote-new` (posible cliente nuevo), `email-quote-vague` (faltan datos), `email-quote-malicious` (pide un descuento y saltarse la revisión).

**Peticiones de renovaciones de la demo** (agente `renovaciones`, fecha de referencia 2026-11-23): `email-renew-martinez` (principal: 5 pólizas, 4 vencen en 60 días y 3 tienen alertas), `email-renew-quiet` (ninguna póliza vence en el plazo), `email-renew-malicious` (pide marcar todo como renovado sin revisión y enviar el correo).

**Peticiones de auditoría de la demo** (agente `auditor-facturas`): `email-audit-martinez` (principal: 5 facturas de Materials i Àrids del Ter, 1 correcta y 4 con anomalías por 4.207 € sin IVA: duplicada, sobreprecio, cantidad no entregada y sin pedido), `email-audit-quiet` (todo cuadra), `email-audit-malicious` (pide dar por buenas las facturas sin cruzarlas y enviar el correo).

**Eventos y agentes:** todos los eventos de una ejecución llevan `agent_id` en su `payload` (las grabaciones antiguas sin él son del agente `gestion-documental`).

**Estados de una ejecución (`runs.status`):** `en_curso` → `completada` | `incompleta` (el agente paró sin cerrar el
expediente) | `error` (fallo de IA, conexión o tiempo máximo) | `interrumpida` (el servidor se reinició a mitad).
**Estados de un borrador (`email_drafts.status`):** `borrador` → `editado` → `aprobado` | `rechazado`.

---

## `GET /api/health`

Comprueba que el servidor está vivo y que hay datos de demo cargados.

- **Auth/CORS:** público, mismo origen.
- **Parámetros:** ninguno.
- **Respuesta 200:** `{"ok", "provider", "model", "data_ready"}`. `data_ready=false` si falta generar los datos
  (`uv run python -m app.seed.generate`).
- **Errores:** ninguno esperado.
- **Efectos colaterales:** ninguno. **Precondiciones:** ninguna. **Idempotencia:** lectura pura.
- **Entorno:** `KROOMIX_AI_PROVIDER`, `KROOMIX_MODEL`, `KROOMIX_DB`.

```bash
curl -s http://127.0.0.1:15600/api/health
```
```json
{"ok":true,"provider":"claude-agent-sdk","model":"sonnet","data_ready":true}
```

---

## `GET /api/agents`

Catálogo de agentes de la plataforma. El menú en cuadrícula y el coordinador se construyen desde aquí.

- **Auth/CORS:** público, mismo origen.
- **Query:** `vertical` (opcional): `gestoria` | `correduria`. Devuelve solo los agentes de ese vertical, con los
  de uso principal primero. Sin filtro, devuelve todos en el orden del catálogo.
- **Respuesta 200:** `{"agents": [Agente, …]}`. Cada agente: `{id, name, summary, pain, input_description, workflow,
  output_description, example_requests[], verticals{vertical: "principal"|"secundario"}, status, icon, default_scenario}`.
  - `status`: `disponible` (se puede ejecutar; tiene `default_scenario` e `impact`) | `proximamente` (solo se muestra; ambos son `null`).
  - `impact`: `{unit_singular, unit_plural, manual_steps[], agent_steps[], kpi_processed}`. Cómo cuenta cada agente su impacto en pantalla.
  - `icon`: nombre de icono de Lucide.
  - Los textos están en lenguaje de negocio, sin terminología técnica.
- **Errores:** `422 invalid_vertical`.
- **Efectos colaterales:** ninguno. **Precondiciones:** ninguna (el catálogo está en código: `backend/app/agents/registry.py`).
- **Idempotencia:** lectura pura.

```bash
curl -s "http://127.0.0.1:15600/api/agents?vertical=correduria"
```
```json
{"agents": [{"id": "comparador-seguros", "name": "Comparador de seguros", "status": "proximamente", "verticals": {"correduria": "principal"}, "default_scenario": null, "…": "…"},
            {"id": "siniestros", "…": "…"}, {"id": "renovaciones", "…": "…"},
            {"id": "gestion-documental", "status": "disponible", "verticals": {"gestoria": "principal", "correduria": "secundario"}, "default_scenario": "email-martinez-nov", "…": "…"}]}
```
(abreviado: son 6 agentes en total y los de correduría salen primero.)
Error:
```json
{"detail": {"error": "invalid_vertical", "message": "El vertical debe ser «gestoria» o «correduria»."}}
```

---

## `GET /api/agents/{agent_id}`

Manifiesto de un agente.

- **Auth/CORS:** público, mismo origen. **Ruta:** `agent_id` (p. ej. `gestion-documental`, `siniestros`).
- **Respuesta 200:** el agente, con los mismos campos que en `GET /api/agents`.
- **Errores:** `404 agent_not_found`.
- **Efectos colaterales:** ninguno. **Precondiciones:** el agente está en el catálogo. **Idempotencia:** lectura pura.

```bash
curl -s http://127.0.0.1:15600/api/agents/siniestros
```
```json
{"id":"siniestros","name":"Gestión de siniestros","summary":"Revisa las condiciones de la póliza, recopila la documentación y prepara la tramitación del siniestro.","pain":"Tramitación administrativa lenta y expedientes incompletos.","input_description":"Comunicación de siniestro, póliza y evidencias.","workflow":"Revisa condiciones, recopila documentación y prepara la tramitación.","output_description":"Expediente de siniestro listo para revisión.","example_requests":["Tramita este siniestro de un cliente"],"verticals":{"correduria":"principal"},"status":"proximamente","icon":"shield-alert","default_scenario":null}
```

---

## `GET /api/scenario`

Devuelve la solicitud de entrada de un agente (correo y adjuntos) y sus hipótesis comerciales. Es lo primero que pinta el
espacio de trabajo del agente (columna «El trabajo que recibís»).

- **Auth/CORS:** público, mismo origen.
- **Query:** `agent_id` (opcional, defecto `gestion-documental`) y `email_id` (opcional, defecto el `default_scenario` del agente).
- **Respuesta 200:**
  - `agent_id`, `firm`: `{name, city}`.
  - `email`: `{id, scenario, from_name, from_address, to_address, subject, body, received_at, period}`.
  - `attachments[]`: `{id, position, filename, mime_type, size_bytes, pages, preview_url, original_url}`. Vacío para `presupuestos`.
  - `sources[]`: `{id, title, subtitle, group}`. Documentos de apoyo que el agente consulta además de la petición (ficha del cliente, cartera de pólizas, tarifario, pedidos, criterios internos…). Se abren con `GET /api/sources/{source_id}`.
  - `assumptions`: `{manual_minutes, review_minutes}` del agente (15/2 documental; 45/5 presupuestos; 40/8 renovaciones; 60/10 auditor de facturas). Son estimaciones comerciales, no resultados medidos.
  - `latest_recorded_run`: `{id, started_at, duration_ms, model}` de la última ejecución `completada` de ese correo, o `null`. Sirve para ofrecer la reproducción sin conexión.
- **Errores:** `404 agent_not_found`; `404 email_not_found`.
- **Efectos colaterales:** ninguno. **Precondiciones:** el agente y el correo existen. **Idempotencia:** lectura pura.
- **Entorno:** `KROOMIX_MANUAL_MINUTES`, `KROOMIX_REVIEW_MINUTES`, `KROOMIX_QUOTE_MANUAL_MINUTES`, `KROOMIX_QUOTE_REVIEW_MINUTES`, `KROOMIX_RENEWAL_MANUAL_MINUTES`, `KROOMIX_RENEWAL_REVIEW_MINUTES`, `KROOMIX_AUDIT_MANUAL_MINUTES`, `KROOMIX_AUDIT_REVIEW_MINUTES`.

```bash
curl -s "http://127.0.0.1:15600/api/scenario?agent_id=presupuestos"
```
```json
{
  "agent_id": "presupuestos",
  "firm": {"name": "Assessoria Vilaseca & Puig", "city": "Vic"},
  "email": {"id": "email-quote-martinez", "scenario": "quote-main", "from_name": "Jordi Martínez",
            "from_address": "jordi@construccionsmartinez.example", "to_address": "documentacio@vilasecapuig.example",
            "subject": "Presupuesto para una sociedad nueva", "body": "Buenos días,\n\nvamos a crear una sociedad nueva …",
            "received_at": "2026-11-23T10:12:00", "period": "2026-11"},
  "attachments": [],
  "assumptions": {"manual_minutes": 45.0, "review_minutes": 5.0},
  "latest_recorded_run": null
}
```

---

## `GET /api/sources/{source_id}` y `GET /api/sources/{source_id}/pdf`

Documento de apoyo (ficticio) de un agente: lo que consulta además de la petición. Se genera al vuelo con los mismos datos que usa el agente. **Nunca incluye datos confidenciales** (márgenes, comisiones, costes internos).

- **Auth y CORS:** público (demo local).
- **Ruta:** `source_id` de `scenario.sources[].id` (p. ej. `cliente`, `reglas`, `cartera`, `ofertas`, `tarifario`, `historico`, `doc-<id>` en el auditor).
- **Query:** `agent_id` (defecto `gestion-documental`), `email_id` (defecto el escenario del agente). La misma pareja que se usó en `/api/scenario`.
- **Éxito `200`:** JSON `{id, title, subtitle, group, sections[]}`; cada sección tiene `fields` (`[[etiqueta, valor]]`), `table` (`{columns, rows, align}`) o `note`. El `/pdf` devuelve `application/pdf` con el mismo contenido.
- **Errores:** `404 agent_not_found`, `404 email_not_found`, `404 source_not_found`.
- **Precondiciones:** el agente y el correo existen. Lectura pura e idempotente; no toca el estado.
- **Ejemplo:**

```bash
curl -s "http://127.0.0.1:15600/api/sources/cartera?agent_id=renovaciones&email_id=email-renew-martinez"
# {"id":"cartera","title":"Cartera de pólizas","subtitle":"Construccions Martínez SL · situación a 23/11/2026","group":"Cartera",
#  "sections":[{"table":{"columns":["Ramo","Aseguradora","Nº de póliza","Vencimiento","Prima anual","Siniestros 12 m"],"align":["l","l","l","r","r","r"],"rows":[["Flota de vehículos","Mapfre","MAP-FL-884102","01/12/2026","4.820,00 €","0"],"…"]}}]}
curl -s -o cartera.pdf "http://127.0.0.1:15600/api/sources/cartera/pdf?agent_id=renovaciones"
```

## `GET /api/inbox` y `POST /api/inbox/{email_id}/launch`

Bandeja de correo externo (IMAP). Se activa con `KROOMIX_IMAP_USER`, `KROOMIX_IMAP_PASSWORD` (contraseña de aplicación) y `KROOMIX_IMAP_ALIAS` (ver `backend/.env.example`); sin ellas `enabled` es `false`. Solo se procesan los correos **no leídos enviados al alias**; cada uno se guarda como petición (`scenario: external`, adjuntos PDF/JPG/PNG validados por contenido) y el coordinador elige el agente, que se lanza con ese correo como entrada.

- **Auth y CORS:** sesión; solo `admin` (a un cliente, `GET` le devuelve `{enabled:false, alias:null, items:[]}` y `POST …/launch` da `403 forbidden`, porque es el correo real del dueño). Nunca devuelve credenciales.
- **`GET /api/inbox` → `200`:** `{enabled, alias, items[]}`; cada ítem `{email_id, status, agent_id, run_id, note, from_name, from_address, subject, received_at, attachments}`. `status`: `pendiente` | `lanzado` | `respondido` (el coordinador no supo asignarlo; `note` es su respuesta) | `ignorado` (remitente no permitido o límite por hora) | `error`. Lectura pura.
- **`POST /api/inbox/{email_id}/launch`:** body `{"agent_id": "presupuestos"}`; lanza a mano un correo ya recibido. `202 {run_id, events_url}`. Errores: `404 email_not_found`, `404 agent_not_found`, `409 agent_unavailable`, `409 run_in_progress`. No idempotente (crea una ejecución).
- **Entorno:** `KROOMIX_IMAP_HOST` (`imap.gmail.com`), `KROOMIX_INBOX_POLL_S` (20), `KROOMIX_INBOX_MAX_RUNS_PER_HOUR` (6), `KROOMIX_INBOX_MAX_ATTACHMENT_MB` (10), `KROOMIX_INBOX_ALLOWED_SENDERS` (vacío = cualquiera).
- **Ejemplo:** `curl -s http://127.0.0.1:15600/api/inbox` → `{"enabled":true,"alias":"lleirgarcia+kroomix@gmail.com","items":[{"email_id":"email-ext-57aec16730","status":"lanzado","agent_id":"gestion-documental","subject":"Facturas de noviembre","attachments":3,"…":"…"}]}`

## `GET /api/quotes/{quote_id}/pdf`

Documento PDF de un presupuesto generado por el agente de presupuestos. **No contiene margen ni costes internos.**

- **Auth/CORS:** público, mismo origen.
- **Ruta:** `quote_id` (p. ej. `PRE-202611-0001`; viene en `case.quote_id` y `case.pdf_url` del evento `run_finished`).
- **Respuesta 200:** `application/pdf`, `Content-Disposition: inline; filename="Presupuesto-<id>.pdf"`.
- **Errores:** `404 quote_not_found` (el identificador no empieza por `PRE-`, no existe o el presupuesto no tiene documento, p. ej. cuando faltan datos del cliente).
- **Efectos colaterales:** ninguno. **Precondiciones:** el presupuesto está cerrado con al menos una línea. **Idempotencia:** lectura pura.
- **Entorno:** `KROOMIX_QUOTES_DIR`.

```bash
curl -s -o presupuesto.pdf http://127.0.0.1:15600/api/quotes/PRE-202611-0001/pdf
```
```
HTTP/1.1 200 OK
content-type: application/pdf
content-disposition: inline; filename="Presupuesto-PRE-202611-0001.pdf"
```
Error:
```json
{"detail": {"error": "quote_not_found", "message": "Presupuesto no encontrado."}}
```

---

## `GET /api/files/{attachment_id}/{variant}`

Sirve un adjunto del correo: la vista previa (PNG) o el original.

- **Auth/CORS:** público, mismo origen.
- **Ruta:** `attachment_id` (p. ej. `email-martinez-nov-a3`); `variant` = `preview` | `original`.
- **Respuesta 200:** el fichero. `preview` → `image/png`; `original` → el `mime_type` del adjunto (`application/pdf`
  o `image/jpeg`). `Content-Disposition: inline`.
- **Errores:** `404 file_not_found` (adjunto inexistente o `variant` distinto de `preview`/`original`).
- **Efectos colaterales:** ninguno. **Precondiciones:** el adjunto existe y su fichero está en `data/files/`.
- **Idempotencia:** lectura pura.

```bash
curl -s -o preview.png http://127.0.0.1:15600/api/files/email-martinez-nov-a3/preview
curl -s -o original.jpg  http://127.0.0.1:15600/api/files/email-martinez-nov-a3/original
```
```
HTTP/1.1 200 OK
content-type: image/png
content-disposition: inline; filename="email-martinez-nov-a3.png"
```

---

## `POST /api/runs`

Arranca un agente real sobre su escenario de demo. Cada llamada consume cuota del modelo y dura unos 30-60 s.

- **Auth/CORS:** público, mismo origen.
- **Body (JSON, opcional):** `{"agent_id": "gestion-documental", "email_id": null}`.
  - `agent_id`: defecto `gestion-documental`; también `presupuestos`, `renovaciones` y `auditor-facturas`. Debe estar `disponible` en `GET /api/agents`.
  - `email_id`: defecto el `default_scenario` del agente (`email-martinez-nov`, `email-quote-martinez` `email-renew-martinez` o `email-audit-martinez`).
- **Respuesta 202:** `{"run_id", "events_url"}`. La ejecución sigue en segundo plano: hay que consumir `events_url`
  (SSE) o consultar `GET /api/runs/{run_id}`.
- **Errores:**
  - `404 agent_not_found` — el agente no existe en el catálogo.
  - `404 email_not_found` — el correo no existe.
  - `409 agent_unavailable` — el agente existe pero está «próximamente».
  - `409 run_in_progress` — ya hay una ejecución en curso (solo se admite una a la vez). Incluye `run_id` de la activa.
- **Efectos colaterales:** inserta una fila en `runs` (`en_curso`, con su `agent_id`); el agente escribe `cases`, `extractions`,
  `duplicate_checks`, `case_documents`, `incidents`, `review_tasks`, `email_drafts`, `audit_log` y `run_events`.
  Llama al CLI de Claude (`claude`) en el equipo. **No envía correos ni toca sistemas externos.**
- **Precondiciones:** datos de demo generados; CLI `claude` instalado y con sesión iniciada.
- **Idempotencia:** **no idempotente**. Cada llamada crea una ejecución y un expediente nuevos (`EXP-AAAAMM-NNNN`).
  Estado: `runs` ∅ → `en_curso` → `completada` | `incompleta` | `error`.
- **Entorno:** `KROOMIX_MODEL`, `KROOMIX_EFFORT`, `KROOMIX_MAX_TURNS`, `KROOMIX_RUN_TIMEOUT_S`, `KROOMIX_FAULTS`.

```bash
curl -s -X POST http://127.0.0.1:15600/api/runs -H 'content-type: application/json' -d '{"agent_id":"gestion-documental"}'
```
```json
{"run_id": "run-20261125-120521-d68a", "events_url": "/api/runs/run-20261125-120521-d68a/events"}
```
Errores:
```json
{"detail": {"error": "agent_unavailable", "message": "Este agente todavía no está disponible."}}
{"detail": {"error": "email_not_found", "message": "No existe el correo nope."}}
```

---

## `POST /api/chat`

Chat de la plataforma. Un **coordinador** con IA lee la petición, decide si algún agente disponible puede hacerla y, si es así,
lo lanza. Responde con un texto en lenguaje de negocio. El progreso del agente lanzado se sigue por `events_url`.

- **Auth/CORS:** público, mismo origen.
- **Body (JSON):** `{"message": string 1-1000 caracteres}`. El texto se trata como **no confiable**: no puede cambiar las
  reglas del coordinador ni saltarse la revisión humana.
- **Respuesta 200:** `{"action", "reply", "agent_id", "run_id", "events_url"}`.
  - `action="launched"`: se ha lanzado un agente. `agent_id`, `run_id` y `events_url` vienen informados; conectar con `events_url`.
  - `action="answered"`: solo hay respuesta (no encaja con ningún agente, el agente aún no está disponible, falta información
    o ya hay una ejecución en curso). Los otros tres campos son `null`.
- **Errores:** `422` (mensaje vacío o de más de 1000 caracteres); `502 coordinator_unavailable` (sin conexión con el servicio de IA).
- **Efectos colaterales:** una llamada al modelo del coordinador (2-5 s). Si lanza un agente, los mismos que `POST /api/runs`.
  **No envía correos.**
- **Precondiciones:** CLI `claude` con sesión iniciada. Si hay una ejecución en curso, el coordinador lo explica y no lanza otra.
- **Idempotencia:** **no idempotente**: repetir la misma petición puede lanzar otra ejecución.
- **Entorno:** `KROOMIX_COORDINATOR_MODEL`.

```bash
curl -s -X POST http://127.0.0.1:15600/api/chat -H 'content-type: application/json' \
  -d '{"message":"Procesa el correo de Construccions Martínez con las facturas de noviembre"}'
```
```json
{"action":"launched","reply":"He lanzado al agente de gestión documental para que procese el correo de Construccions Martínez con las facturas de noviembre. Irá revisando los documentos adjuntos, comprobando duplicados y dejando el expediente organizado; te avisaré cuando haya terminado.","agent_id":"gestion-documental","run_id":"run-20261125-130412-7c1e","events_url":"/api/runs/run-20261125-130412-7c1e/events"}
```
Petición que no encaja con ningún agente:
```json
{"action":"answered","reply":"Eso no lo puedo hacer ahora: Kroomix no prepara declaraciones de la renta. Sí puedo ayudarte con la documentación de tus clientes…","agent_id":null,"run_id":null,"events_url":null}
```

---

## `GET /api/runs/{run_id}`

Estado y métricas de una ejecución.

- **Auth/CORS:** público, mismo origen.
- **Ruta:** `run_id`.
- **Respuesta 200:** `{id, email_id, status, model, started_at, finished_at, duration_ms, error, cost_usd, turns, case_id, agent_id}`.
  `duration_ms` es el **tiempo real** de ejecución del agente. `cost_usd` es el coste equivalente a tarifa de API
  (informativo: con la suscripción no se factura).
- **Errores:** `404 run_not_found`.
- **Efectos colaterales:** ninguno. **Precondiciones:** la ejecución existe. **Idempotencia:** lectura pura.

```bash
curl -s http://127.0.0.1:15600/api/runs/run-20261125-120521-d68a
```
```json
{"id":"run-20261125-120521-d68a","email_id":"email-martinez-nov","status":"completada","model":"sonnet","started_at":"2026-11-25T12:05:21","finished_at":"2026-11-25T12:06:07","duration_ms":45432,"error":null,"cost_usd":0.3857,"turns":40,"case_id":"EXP-202611-0001"}
```

---

## `GET /api/runs/{run_id}/events`

Flujo **Server-Sent Events** con los eventos de negocio de la ejecución. Primero reenvía los ya guardados y, si la
ejecución sigue en curso, continúa en directo hasta su fin. Alimenta la columna central y los indicadores.

- **Auth/CORS:** público, mismo origen.
- **Ruta:** `run_id`. **Query:** `after` (entero, defecto 0): solo eventos con `seq > after`. Permite reanudar tras un corte
  pasando el último `seq` recibido (el frontend actual no lo usa).
- **Respuesta 200** (`text/event-stream`): un bloque por evento, `id: <seq>`, `event: message`, `data: <JSON>`.
  Cada `15 s` sin eventos envía el comentario `: keep-alive`. Al terminar emite `event: end`.
- **Eventos (`type`, con su `payload`):**
  - `run_started`: `{agent_id, run_id, email_id, phases[{id,label}], kpi_labels, documents_total, started_at}`. Las fases y las etiquetas de los indicadores dependen del agente.
  - `activity_started`: `{id, phase, label, attachment_id?}`.
  - `activity_finished`: `{id, status, label, detail, duration_ms, attachment_id?}`. `status` ∈ `done` | `review` | `error`.
  - `document_status`: `{attachment_id, status}`. `status` ∈ `valid` | `duplicate` | `needs_review`.
  - `result`: `{kind, data}`. Resultado parcial para la columna derecha. `kind`: `client`, `case`, `document`, `incident`, `task`, `draft`, `summary` y, del agente de presupuestos, `quote_line`, `quote_totals`, `quote_internal` (margen y coste: solo para la gestoría) y, del agente de renovaciones, `renewal_policy` (una póliza revisada con sus alertas y su recomendación) y, del auditor de facturas, `audit_invoice` (una factura cruzada con sus anomalías, importes afectados y acción recomendada).
  - `metrics`: `{actions, documents_processed, documents_total, incidents, minutes_saved}`.
  - `run_finished`: `{status, error, duration_ms, case, automated_actions, ai_cost_eur}`. `case` es el expediente (documental) el presupuesto (`quote_id`, `lines[]`, `totals`, `internal`, `pdf_url`, `status`) o la revisión de renovaciones (`renewal_id`, `policies[]`, `totals`, `internal.commission` —solo para la correduría—, `status`: `listo_para_revision` | `sin_vencimientos`) completos, o la auditoría (`audit_id`, `supplier`, `invoices[]`, `totals` con `at_risk_base`/`at_risk_vat`/`at_risk_total`/`by_kind`, `status`: `listo_para_revision` | `sin_facturas`), o `null`.
    `ai_cost_eur` es el coste estimado de la IA de esa ejecución (coste a tarifa de API × `KROOMIX_USD_EUR`), o `null` si no se conoce.
    En grabaciones anteriores a este campo se calcula al leerlas desde `runs.cost_usd`.
- Los eventos solo contienen acciones verificables en lenguaje de negocio: ni prompts, ni tokens, ni nombres de herramientas.
- **Errores:** `404 run_not_found` (antes de abrir el flujo).
- **Efectos colaterales:** ninguno (lectura). **Precondiciones:** la ejecución existe. **Idempotencia:** lectura pura; se
  puede reconectar con `after` sin duplicar eventos.

```bash
curl -s -N "http://127.0.0.1:15600/api/runs/run-20261125-120521-d68a/events?after=125"
```
```
id: 126
event: message
data: {"seq": 126, "t_ms": 40336, "type": "metrics", "payload": {"actions": 28, "documents_processed": 5, "documents_total": 5, "incidents": 2, "minutes_saved": 13.0}}

id: 128
event: message
data: {"seq": 128, "t_ms": 45438, "type": "run_finished", "payload": {"automated_actions": 28, "case": {"case_id": "EXP-202611-0001", …}, "duration_ms": 45432, "error": null, "status": "completada"}}

event: end
data: {}
```

---

## `GET /api/runs/{run_id}/events.json`

Los mismos eventos en un único JSON. Es la fuente de la **reproducción sin conexión** de una ejecución real grabada.

- **Auth/CORS:** público, mismo origen.
- **Ruta:** `run_id`.
- **Respuesta 200:** `{"run": {…como GET /api/runs/{run_id}…}, "events": [{seq, t_ms, type, payload}, …]}`, ordenados por
  `seq`. `t_ms` son los tiempos originales, lo que permite reproducir sin falsear la duración.
- **Errores:** `404 run_not_found`.
- **Efectos colaterales:** ninguno. **Precondiciones:** la ejecución existe. **Idempotencia:** lectura pura.

```bash
curl -s http://127.0.0.1:15600/api/runs/run-20261125-120521-d68a/events.json
```
```json
{"run": {"id": "run-20261125-120521-d68a", "status": "completada", "duration_ms": 45432, "…": "…"},
 "events": [{"seq": 1, "t_ms": 0, "type": "run_started", "payload": {"documents_total": 5, "email_id": "email-martinez-nov", "run_id": "run-20261125-120521-d68a", "…": "…"}},
            {"seq": 2, "t_ms": 1, "type": "activity_started", "payload": {"id": "act-0", "label": "Recibiendo el correo", "phase": "recepcion"}}]}
```
(Esa ejecución tiene 128 eventos.)

---

## `GET /api/drafts/{draft_id}`

Borrador de correo preparado por el agente, con el historial de acciones del empleado.

- **Auth/CORS:** público, mismo origen.
- **Ruta:** `draft_id` (p. ej. `BOR-1557246b`; viene en `case.email_draft.id` del evento `run_finished`).
- **Respuesta 200:** `{id, case_id, to_address, subject, body, status, created_at, updated_at, actions[{action, body, at}]}`.
  `to_address` sale de la ficha del cliente, nunca lo elige el modelo.
- **Errores:** `404 draft_not_found`.
- **Efectos colaterales:** ninguno. **Precondiciones:** el borrador existe. **Idempotencia:** lectura pura.

```bash
curl -s http://127.0.0.1:15600/api/drafts/BOR-1557246b
```
```json
{"id":"BOR-1557246b","case_id":"EXP-202611-0002","to_address":"jordi@construccionsmartinez.example","subject":"Falta la factura del alquiler de noviembre","body":"Hola Jordi,\n\nGracias por enviarnos la documentación de noviembre. …","status":"borrador","created_at":"2026-11-25T12:08:22","updated_at":"2026-11-25T12:08:22","actions":[]}
```

---

## `PUT /api/drafts/{draft_id}`

Edita asunto y cuerpo del borrador (botón «Editar»).

- **Auth/CORS:** público, mismo origen.
- **Body (JSON):** `{"subject": string 1-160, "body": string 1-4000}`.
- **Respuesta 200:** el borrador con `status="editado"` y `"sent": false`.
- **Errores:** `404 draft_not_found`; `409 draft_closed` si ya está `aprobado` o `rechazado`; `422` si faltan campos o
  están vacíos/demasiado largos.
- **Efectos colaterales:** actualiza `email_drafts`; añade una fila a `draft_actions` (`editar`) y otra a `audit_log`
  (actor `empleado`, `borrador:editar`). No envía nada.
- **Precondiciones:** el borrador existe y está en `borrador` o `editado`.
- **Idempotencia:** repetir con el mismo cuerpo deja el mismo contenido, pero añade una acción más al historial
  (no es estrictamente idempotente). Estado: `borrador` | `editado` → `editado`.

```bash
curl -s -X PUT http://127.0.0.1:15600/api/drafts/BOR-1557246b -H 'content-type: application/json' \
  -d '{"subject":"Falta el alquiler","body":"Buenos días, ¿podéis enviarnos la factura del alquiler?"}'
```
```json
{"id":"BOR-1557246b","case_id":"EXP-202611-0002","to_address":"jordi@construccionsmartinez.example","subject":"Falta el alquiler","body":"Buenos días, ¿podéis enviarnos la factura del alquiler?","status":"editado","created_at":"2026-11-25T12:08:22","updated_at":"2026-11-25T12:30:29","sent":false}
```
Error:
```json
{"detail": {"error": "draft_closed", "message": "El borrador ya está aprobado."}}
```

---

## `POST /api/drafts/{draft_id}/approve`

Aprueba el borrador (botón «Aprobar»). **Solo lo registra: no se envía ningún correo.**

- **Auth/CORS:** público, mismo origen. **Body:** ninguno.
- **Respuesta 200:** el borrador con `status="aprobado"` y `"sent": false`.
- **Errores:** `404 draft_not_found`; `409 draft_closed` si ya está `rechazado`.
- **Efectos colaterales:** actualiza `email_drafts`; añade `draft_actions` (`aprobar`) y `audit_log`
  (`borrador:aprobar`, actor `empleado`).
- **Precondiciones:** el borrador existe y no está rechazado.
- **Idempotencia:** se puede repetir sin cambiar el estado final, pero cada llamada añade una fila al historial.
  Estado: `borrador` | `editado` | `aprobado` → `aprobado`.

```bash
curl -s -X POST http://127.0.0.1:15600/api/drafts/BOR-1557246b/approve
```
```json
{"id":"BOR-1557246b","case_id":"EXP-202611-0002","to_address":"jordi@construccionsmartinez.example","subject":"Falta el alquiler","body":"Buenos días, ¿podéis enviarnos la factura del alquiler?","status":"aprobado","created_at":"2026-11-25T12:08:22","updated_at":"2026-11-25T12:30:29","sent":false}
```

---

## `POST /api/drafts/{draft_id}/reject`

Rechaza el borrador (botón «Rechazar»).

- **Auth/CORS:** público, mismo origen. **Body:** ninguno.
- **Respuesta 200:** el borrador con `status="rechazado"` y `"sent": false`.
- **Errores:** `404 draft_not_found`; `409 draft_closed` si ya está `aprobado`.
- **Efectos colaterales:** actualiza `email_drafts`; añade `draft_actions` (`rechazar`) y `audit_log` (`borrador:rechazar`).
- **Precondiciones:** el borrador existe y no está aprobado.
- **Idempotencia:** como `approve`. Estado: `borrador` | `editado` | `rechazado` → `rechazado`. Un borrador
  `rechazado` ya no se puede editar ni aprobar.

```bash
curl -s -w " %{http_code}\n" -X POST http://127.0.0.1:15600/api/drafts/BOR-1557246b/reject
```
```
{"detail":{"error":"draft_closed","message":"El borrador ya está aprobado."}} 409
```

---

## Acceso y trazabilidad

Usuarios en la tabla `users` (contraseña con scrypt), sesiones en `sessions` (solo se guarda el hash del token), actividad en
`activity`. `uv run python -m app.seed.generate` **conserva** estas tres tablas al regenerar los datos de demo.
Gestión desde terminal: `uv run python -m app.auth.cli create|passwd|list` (en `backend/`).

### `POST /api/auth/login`
- **Auth/CORS:** público, mismo origen. **Body:** `{"username": str, "password": str}`.
- **200:** `{"user": {id, username, display_name, company, role, active, created_at, last_login_at}}` + cabecera `Set-Cookie: kroomix_session=…`.
- **Errores:** `401 invalid_credentials`; `429 too_many_attempts` (tras `KROOMIX_LOGIN_MAX_FAILURES` fallos del usuario o 4× por IP, aunque acierte después).
- **Ejemplo:** `curl -c jar -X POST $B/api/auth/login -H 'content-type: application/json' -d '{"username":"acme","password":"…"}'`
- **Precondiciones:** el usuario existe y está activo. **Idempotencia:** no idempotente (cada llamada abre una sesión nueva). Registra `login` / `login_failed`.

### `POST /api/auth/logout` · `GET /api/auth/me`
- Requieren sesión. `logout` borra la sesión y la cookie (`{"ok": true}`) y registra `logout`. `me` devuelve `{"user": {...}}`; sin sesión, `401`. Ambos sin efectos más allá de lo dicho; `me` es lectura pura.

### `POST /api/track`
- **Auth:** sesión. **Body:** `{"event": str ≤60, "detail": {"label": "texto legible", …}}`. **204** sin cuerpo.
- Registra una acción de interfaz que no genera petición propia (abrir la guía, volver al inicio…) como `kind="ui"`. Solo escritura en `activity`; no idempotente.
- **Ejemplo:** `curl -b jar -X POST $B/api/track -H 'content-type: application/json' -d '{"event":"open_guide","detail":{"label":"Abrió la guía"}}'`

### `GET /api/admin/users` · `POST /api/admin/users` · `PATCH /api/admin/users/{id}` · `POST /api/admin/users/{id}/reset-password`
- **Auth:** solo `admin`.
- `GET` → `{"users": [{…usuario, open_sessions, logins, actions, runs, chats, last_activity}]}` (lectura pura).
- `POST` body `{"username": "3-40 de [a-z0-9._-]", "display_name", "company", "role": "client"|"admin", "password"?}` → **201** `{"user", "password"}`; si no se envía `password` se genera una de 12 caracteres, **que solo se devuelve aquí**. Errores: `422 invalid_user`, `409 user_exists`.
- `PATCH` body `{"active": bool}` → `{"user"}`. Desactivar cierra sus sesiones y le impide entrar. Errores: `404 user_not_found`, `409 self_deactivate`. Idempotente.
- `reset-password` → `{"password": "…"}` (nueva, única vez visible); cierra las sesiones del usuario. No idempotente.

### `GET /api/admin/activity` · `GET /api/admin/activity/{id}`
- **Auth:** solo `admin`. Lectura pura.
- **Query:** `user_id`, `kind` (`api`|`ui`|`login`|`login_failed`|`logout`), `q` (busca en resumen, ruta y usuario), `before_id` (paginación), `limit` (1–500, def. 100).
- **200 lista:** `{"items": [{id, at, user_id, username, session_id, kind, method, path, status, duration_ms, ip, summary, run_id}]}` ordenados del más reciente al más antiguo. `summary` es una frase en castellano («Ejecutó el agente «presupuestos»», «Chat: «…» → lanzó el agente …»). `run_id` enlaza con `GET /api/runs/{run_id}/events.json` para ver qué hizo el agente.
- **200 detalle:** la fila completa con `request`, `response` (JSON en texto) y `user_agent`. `404 activity_not_found`.
- **Ejemplo:** `curl -b jar "$B/api/admin/activity?user_id=2&kind=api&limit=20"`

---

## Ficheros estáticos — `GET /` y `GET /{ruta}`

Sirve el frontend compilado (`frontend/dist`, con `index.html` como respuesta por defecto). Solo existe si `dist/` está
construido (`./start.sh` lo construye). Público, lectura pura, sin parámetros.
