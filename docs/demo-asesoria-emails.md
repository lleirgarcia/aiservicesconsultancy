# Guía paso a paso — Demo Asesoría con IA

Cómo dejar lista y presentar la demo de clasificación de emails ante un cliente.

URL: `/demos/asesoria-emails`

---

## 1. Requisitos previos (una sola vez)

1. **Cuenta de Gmail** con verificación en dos pasos (2FA) activada.
2. **App Password de Google** (no la contraseña normal):
   - Google Account → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones.
   - Genera una y cópiala (16 caracteres).
3. **API key de Anthropic** (console.anthropic.com).

---

## 2. Configurar `.env.local`

En la raíz del proyecto, crea o edita `.env.local`:

```
GMAIL_USER=tu-cuenta@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
ANTHROPIC_API_KEY=sk-ant-...
```

- `GMAIL_APP_PASSWORD`: la App Password del paso 1, con o sin espacios.
- Sin estas variables la demo muestra "No se pudo conectar a Gmail" o falla la clasificación.

---

## 3. Preparar los emails de prueba

La bandeja **solo lee emails cuyo asunto contenga `[DEMO KROOMIX]`**. El resto de tu correo se ignora.

1. Envía a `GMAIL_USER` varios correos con `[DEMO KROOMIX]` al inicio del asunto.
2. Usa remitentes y adjuntos realistas para que la demo luzca. Ejemplos:

   | Asunto | Adjunto | Qué demuestra |
   |--------|---------|---------------|
   | `[DEMO KROOMIX] Factura abril 2026 — Garatge Puig SL` | `factura.pdf` | Detecta factura + cliente |
   | `[DEMO KROOMIX] Nóminas abril — Bistró Mercè` | `nominas.zip` | Detecta nóminas |
   | `[DEMO KROOMIX] Modelo 303 1T 2026 — Fusteria Vidal` | `303.pdf` | Detecta modelo tributario |
   | `[DEMO KROOMIX] Justificante transferencia — Constructora Roca` | `transfer.pdf` | Detecta justificante bancario |
   | `[DEMO KROOMIX] Cena anual de socios — confirma asistencia` | (sin adjunto) | Lo clasifica como "Otros" |

3. Los clientes reconocidos están en `src/app/demos/asesoria-emails/data.ts`. Menciona esos nombres en los asuntos para que la IA acierte el cliente:
   - Garatge Puig SL · Bistró Mercè · Fusteria Vidal · Oliveres del Vall SCP · Consultora Mas · Constructora Roca

> Consejo: manda 6–10 emails variados. Mezcla facturas, nóminas, modelos y algún correo sin adjunto para que se vea que también sabe descartar.

---

## 4. Arrancar el servidor

En una terminal (déjala abierta durante toda la demo):

```
npm run dev -- -p 5520
```

- Local: http://localhost:5520/demos/asesoria-emails
- Móvil / otra máquina en la misma red: http://192.168.1.70:5520/demos/asesoria-emails

---

## 5. Guion de la presentación

1. **Abre la URL.** Se conecta a Gmail y pinta la bandeja con los emails `[DEMO KROOMIX]`.
2. **Explica el dolor:** "Ahora mismo alguien abre cada email, descarga el adjunto, lo renombra y lo mueve a la carpeta del cliente. 30–50 veces al día."
3. **Pulsa "▶ Procesar todo".** La IA va email por email:
   - Lee asunto y remitente.
   - Mira los adjuntos.
   - Identifica el tipo de documento y el cliente.
   - Renombra con la convención `YYYY-MM-DD_Tipo_Proveedor_Cliente.ext`.
   - Lo archiva en la carpeta del cliente (columna derecha).
4. **Selecciona un email a mano** para enseñar el razonamiento paso a paso en el panel central.
5. **Señala las métricas** de la barra superior: horas ahorradas y coste evitado suben en tiempo real.
6. **Muestra un urgente:** si un email lleva palabras como "urgente", "embargo" o "requerimiento", se marca con aviso al responsable.
7. **Cierra con el CTA:** "Esto mismo, conectado a tu bandeja real (Gmail, Outlook o IMAP), funcionando solo cada día."

Controles útiles durante la demo:
- **Velocidad → Rápido:** acelera la animación si el cliente tiene prisa.
- **↺ Reiniciar:** vuelve a cargar la bandeja para repetir la demo.
- **Filtro de cliente** (columna derecha): enseña todos los documentos archivados de un cliente concreto.

---

## 6. Si algo falla

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| "No se pudo conectar a Gmail" | Credenciales mal o falta 2FA | Revisa `GMAIL_USER` / `GMAIL_APP_PASSWORD` en `.env.local` |
| Bandeja vacía | No hay emails con `[DEMO KROOMIX]` | Envía correos con ese texto en el asunto |
| Un email no se clasifica | Falta `ANTHROPIC_API_KEY` o error de red | Revisa la key y la consola del servidor |
| Cliente equivocado | El asunto no menciona un cliente registrado | Usa los nombres de `data.ts` en los asuntos |
| El servidor se cae solo | Se lanzó desde una tarea en background | Arráncalo en tu propia terminal y déjala abierta |

---

## Referencia rápida de archivos

- Frontend: `src/app/demos/asesoria-emails/BandejaInteligente.tsx`
- Clientes y datos: `src/app/demos/asesoria-emails/data.ts`
- Lectura de Gmail: `src/lib/gmail-imap.ts`
- Clasificación IA: `src/app/api/demos/asesoria-emails/clasificar/route.ts`
