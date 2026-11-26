# Pasos para venta en demo presencial

Guion para presentar Kroomix a propietarios y responsables de gestorías y asesorías. Dura unos 10-15 minutos.
La demo ejecuta el agente real: tarda unos 25-60 s y el resultado puede variar ligeramente entre ejecuciones.

La plataforma tiene una **pantalla de inicio** con un campo de texto («Cuéntale a Kroomix qué necesitas») y una cuadrícula de agentes.
Hay **cuatro agentes disponibles**: gestión documental, presupuestos, renovaciones y auditor de facturas. Los demás aparecen como «Próximamente».
El filtro «Gestorías / Corredurías de seguros» muestra primero los agentes que más encajan con cada sector.

## 1. Antes de salir de casa

- [ ] Portátil cargado y conectado a internet (el agente llama al modelo de IA).
- [ ] Sesión de Claude iniciada: `claude -p "di ok"` responde.
- [ ] Arrancar la demo: `./start.sh` desde `demos/`. Se abre en `http://127.0.0.1:15600`.
- [ ] Hacer **una ejecución completa de prueba de cada agente** que vayas a enseñar y comprobar que termina bien
      («Expediente listo para revisión» / «Presupuesto listo para revisión»). Así queda una grabación válida para el plan B.
- [ ] Pulsar «Reiniciar» para dejar la pantalla en el estado inicial.
- [ ] Pantalla a pantalla completa, notificaciones silenciadas, brillo al máximo.

**Plan B sin conexión o si falla la IA:** aparece el botón «Reproducir grabación» con la última ejecución real.
La pantalla indica que es una reproducción. Dilo en voz alta: no la presentes como una ejecución en directo.

## 2. Guion de la reunión

### Paso 0 · Elegir el agente (1 min)

Empieza en la pantalla de inicio. Hay dos formas de arrancar, las dos válidas:

- **Pidiéndolo por el chat** (la más llamativa): escribe, o pulsa una sugerencia, por ejemplo «Procesa el correo de Construccions Martínez».
  Kroomix elige el agente, se resalta su tarjeta y se abre el espacio de trabajo.
- **Pulsando la tarjeta** del agente. Después, «Ejecutar demostración».

Si preguntan por seguros: filtra por **Corredurías de seguros** y explica que renovaciones ya funciona y que comparador de seguros y siniestros
son los siguientes agentes. Auditor de facturas es el más claro en gestorías. **Hoy no se pueden ejecutar** y la plataforma lo dice si se lo piden por el chat: no los vendas como disponibles.

### Si preguntan «¿con qué información trabaja?»

En la columna de entrada, bajo la petición, está **«Información que consulta Kroomix»**: ficha del cliente, y según el agente el histórico,
el tarifario, la cartera de pólizas y las ofertas de la aseguradora, o los pedidos, albaranes y facturas del proveedor, más los criterios internos.
Púlsalos para abrirlos; cada uno tiene botón **PDF** por si quieren verlo o llevárselo. Todos son ficticios y no incluyen márgenes ni comisiones.
Úsalo para contestar «¿y de dónde saca los precios / las fechas / los importes?»: de aquí, y es lo que luego usa el sistema para calcular.

### Paso 1 · Plantear el problema (1-2 min, antes de tocar nada)

Con la pantalla en estado inicial (correo y documentos visibles, agente parado), deja que lean el correo.
Pregunta cuántos correos así reciben al día y cuánto tarda alguien en procesar cada uno.

### Paso 2 · Presentar la demo

> «Imagina que este correo lo acaba de recibir uno de tus trabajadores. Normalmente tendría que abrirlo, revisar los documentos, introducir los datos y comprobar si falta algo. Mira lo que hace nuestro sistema».

### Paso 3 · Ejecutar y callar (≈ 45 s)

Pulsa **Ejecutar demostración** y **deja que el empresario observe el proceso**. No hables encima de la pantalla.
Si hace preguntas, cógelas al final. Solo señala con el dedo cuando pase algo:

- El timeline avanza línea a línea: cada línea es una acción real del agente.
- Los documentos de la izquierda cambian de estado mientras se procesan.
- Los indicadores de arriba suben en directo.

Si necesitas explicar algo, usa **Pausar** (no falsea el tiempo real) y **Continuar**. También existe el botón **Guía**,
una explicación punto a punto sobre la propia pantalla.

### Paso 4 · Enseñar lo que ha encontrado (2-3 min)

Cuando termine, recorre el resultado de derecha a izquierda:

1. **Factura duplicada:** «Nos han mandado la misma factura dos veces, una en PDF y otra en foto. Kroomix la ha visto y no la ha contado dos veces».
2. **Factura del alquiler que falta:** «Cada mes llegaba, y este mes no. Nadie se lo había pedido».
3. **El borrador del correo:** ya escrito, con los hechos comprobados. Enséñales los botones **Aprobar / Editar / Rechazar**.
   Aclara que **no se envía nada sin que una persona lo apruebe** (aprobar solo lo registra en la demo).
4. **Tareas para el equipo:** «Vuestro equipo solo interviene donde aporta valor».

### Variante · Agente de presupuestos (4-5 min)

Útil para gestorías que dedican horas a preparar propuestas. Mismo patrón, otro trabajo:

> «Un cliente os escribe pidiendo precio por montar una sociedad nueva y llevarle la contabilidad. Mira lo que hace nuestro sistema».

Qué señalar cuando termine:

1. **Los precios salen de vuestro tarifario**, nunca los inventa la IA. Cada línea enseña la frase del cliente que la justifica.
2. **Lo que no está en vuestro tarifario no lo presupuesta** (en la demo, las subvenciones europeas): lo marca como pendiente y crea una tarea.
3. **El descuento por volumen y el IVA los calcula el sistema**, no el modelo.
4. **El PDF** («Ver PDF») es el documento para el cliente: no lleva margen ni costes.
5. **«Solo para la gestoría»**: el margen y el coste interno solo los ve vuestro equipo.
6. El correo se prepara y **se aprueba por una persona**; en la demo no se envía nada.

Cifras de impacto de este agente (45 min manual frente a 5 min de revisión) y su coste (céntimos) también son **estimaciones**.

### Variante · Agente de renovaciones (4-5 min)

La más natural para corredurías, y también útil en gestorías con seguros de sus clientes. Pérdida de clientes por falta de seguimiento:

> «Un cliente tiene varios seguros que vencen en las próximas semanas. Normalmente alguien tendría que acordarse, abrir cada póliza,
> comparar la oferta de la aseguradora y avisar al cliente. Mira lo que hace nuestro sistema».

Qué señalar cuando termine:

1. **Solo toca lo que vence en 60 días**: una póliza que vence en mayo no se revisa ni se menciona.
2. **Las alertas las calcula el sistema, no la IA**: subida de prima superior al 10 %, cobertura reducida, siniestralidad alta o falta de oferta.
   Una póliza con alertas **no se puede dar por renovada** sin que una persona lo vea.
3. **Dinero en riesgo**: las primas con alertas, frente al total que vence. Es el dato que más suele impresionar.
4. **Urgentes** (15 días o menos), ordenadas primero.
5. **Cada alerta genera una tarea** para el corredor y el correo al cliente queda como borrador; **no se envía nada sin aprobación**.
6. **«Solo para la correduría»**: la comisión estimada no aparece en el correo.

Las cifras de impacto (40 min manual frente a 8 min de revisión) y el coste de la IA son **estimaciones**.
El cliente de la demo es una constructora y los seguros son de empresa (flota, responsabilidad civil, oficinas, salud colectiva): el entorno sigue siendo el de la gestoría ficticia.

### Variante · Agente auditor de facturas (4-5 min)

Para gestorías y empresas que pagan facturas de proveedores sin cruzarlas con pedidos y albaranes. Errores económicos, duplicidades y cobros incorrectos:

> «Un proveedor os manda cinco facturas del mes. Normalmente nadie las compara con lo que se pidió y lo que llegó de verdad. Mira lo que hace nuestro sistema».

Qué señalar cuando termine:

1. **El importe afectado** (cifra grande): el dinero que se habría pagado de más o sin motivo. Es lo que más impacta.
2. **Cuatro tipos de problema** en una sola auditoría: factura duplicada, precio superior al pedido, cantidad facturada y no entregada, y factura sin pedido.
3. **El cruce y los importes los calcula el sistema**, no la IA. La IA decide qué hacer con cada factura y redacta; **no puede dar por buena una factura con anomalías**.
4. **Una factura correcta** también aparece, marcada como pagable: no inventa problemas.
5. **Cada anomalía genera una tarea** y el correo al cliente queda como borrador; **no se envía ni se paga nada sin aprobación**.

Las cifras de impacto (60 min manual frente a 10 min de revisión) y el coste de la IA son **estimaciones**. El importe afectado de la demo es de datos ficticios: no lo presentes como ahorro garantizado.

### Paso 5 · El impacto (2 min)

Baja al bloque **«El impacto en vuestra empresa»**:

- Antes: abrir, descargar, interpretar, introducir, consultar, detectar, reclamar. Con Kroomix: revisar incidencias y validar.
- Tiempo por expediente: 15 min manual frente a 2 min de revisión, ≈ 13 min recuperados.
- El **tiempo real del agente** (el cronómetro) es distinto del tiempo humano estimado. Dilo así.
- El **coste de Kroomix por expediente** (céntimos) frente al coste del trabajo manual.

**Todas esas cifras son estimaciones, no resultados demostrados.** Están etiquetadas así en pantalla; no las vendas como garantizadas.

### Paso 6 · Cerrar con su propia calculadora (2-3 min)

> «Ahora imagina esto funcionando durante toda la jornada laboral, con todos vuestros clientes».

En **«¿Cuánto supondría en vuestra gestoría?»**, **que sea el empresario quien teclee sus números**:
expedientes al día, minutos manuales, coste por hora y días laborables.

- Muestra las horas recuperadas al día, al mes y al año, y la capacidad equivalente en personas.
- Matiz importante: **capacidad recuperada no es ahorro efectivo**. Solo se convierte en dinero si esas horas se dedican a
  nuevos clientes, a trabajo de más valor o evitan una contratación. Dilo tú antes de que lo pregunten.

Termina con el mensaje final de la pantalla:

> **Menos trabajo administrativo. Más capacidad para hacer crecer vuestro negocio.**

### Paso 7 · Siguiente paso

Cierra con una acción concreta, no con «ya os llamaré». Por ejemplo: pedirles **3 o 4 correos reales anonimizados**
para repetir la demo con sus propios documentos, y fijar fecha.

## 3. Preguntas que van a hacer

| Pregunta | Respuesta honesta |
|---|---|
| «¿Se le puede escapar un vencimiento?» | Los plazos y las alertas los calcula el sistema con las fechas de la cartera. Con pólizas reales hay que probarlo con vuestros datos y vuestro programa de gestión. |
| «¿Y si encuentra un falso problema?» | Los cruces son aritmética exacta con los documentos; lo que marca lo revisa una persona antes de reclamar nada. Con documentos reales hay que probarlo. |
| «¿Puede inventarse un precio?» | No: los precios los pone el sistema desde el tarifario, y lo que no está en él queda pendiente de una persona. |
| «¿Y si el cliente pide un descuento?» | No se concede automáticamente: va a dirección como tarea. Solo se aplica el descuento por volumen de vuestras reglas. |
| «¿Y si se equivoca?» | Por eso hay revisión humana. Las cifras las calcula el sistema con validaciones exactas, y lo que no puede verificar lo marca como pendiente en lugar de inventarlo. |
| «¿Envía correos solo?» | No. Prepara el borrador y una persona lo aprueba. |
| «¿Qué pasa con mis datos?» | En esta demo todo es ficticio y local. Los datos reales y su tratamiento hay que hablarlos aparte (RGPD, proveedor de IA); no lo improvises. |
| «¿Se conecta con mi programa de contabilidad?» | La arquitectura está pensada para conectar correo, ERP y contabilidad, pero esta versión usa integraciones simuladas. No prometas fechas ni programas concretos sin haberlo estudiado. |
| «¿Cuánto cuesta?» | El coste de la IA por expediente son céntimos, pero no es el precio del servicio. Ten preparada una respuesta sobre implantación y cuota antes de la reunión. |
| «Con mis documentos, ¿funciona igual?» | Con documentos reales hay que probarlo. Esta es la razón del paso 7. |

## 4. Lo que NO hay que hacer

- No decir que el agente es infalible ni garantizar porcentajes de ahorro: son hipótesis iniciales.
- No pulsar «Ejecutar» varias veces seguidas ni durante una ejecución en curso (solo admite una a la vez).
- No pedir por el chat cosas de los agentes «Próximamente» esperando que funcionen: el coordinador dirá que aún no están disponibles.
- No abrir otro agente a mitad de una ejecución: deja de verse en pantalla y, hasta que termine, no se puede lanzar otra (solo admite una a la vez).
- No presentar la reproducción grabada como una ejecución en directo.
- No hablar de modelos, tokens, herramientas ni «prompts». La interfaz tampoco los muestra.
- No aprobar el borrador esperando que salga un correo: en la demo no se envía nada.

## 5. Si algo falla

- **La ejecución termina con error o incompleta:** pulsa «Reiniciar» y vuelve a ejecutar. Si falla de nuevo, usa «Reproducir grabación».
- **No carga la página:** `./start.sh` desde `demos/` y espera a ver «Kroomix · demo en http://127.0.0.1:15600».
- **Para y vuelve a arrancar el servidor:** `pkill -f "uvicorn app.api.main:app"` y después `./start.sh`.
