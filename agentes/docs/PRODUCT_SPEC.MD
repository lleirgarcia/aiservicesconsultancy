# KROOMIX — Agentic Document Management Demo

**Estado:** EN DESARROLLO

## 0. Decisiones (2026-11-25)

- **Marca:** Kroomix. Donde la spec dice «Chromix», léase «Kroomix».
- **Estética:** futurista minimalista con **tema claro**. Sustituye a los puntos «fondo blanco» y «evitar estética futurista» de la sección 8 y al modo oscuro de `../conventions.md`. Se mantienen las tipografías de las convenciones (Space Grotesk, Inter, Geist Mono).
- **Modelo por defecto:** Sonnet, vía Claude Agent SDK (usa la sesión del CLI `claude`, sin clave de API). Configurable con `KROOMIX_MODEL`.
- **Sin conexión:** cada ejecución real se graba. Si no hay conexión se puede reproducir la última ejecución real, etiquetada en pantalla como reproducción.
- **Mini-tutorial:** guía dinámica punto a punto superpuesta en la página, que avanza con los eventos reales de la ejecución.

## 1. Contexto y objetivo

Chromix es una empresa tecnológica especializada en mejorar la productividad y rentabilidad empresarial mediante workflows agénticos de inteligencia artificial.

Quiero construir una aplicación web funcional que sirva como demostración comercial presencial para propietarios y responsables de gestorías y asesorías.

El usuario objetivo no tiene conocimientos técnicos.

La aplicación debe demostrar cómo un agente de inteligencia artificial puede recibir trabajo administrativo, interpretarlo, tomar decisiones, consultar información empresarial, ejecutar acciones y entregar un resultado listo para revisión humana.

No quiero construir un chatbot, un simple extractor de documentos ni un gestor documental tradicional. Quiero demostrar el funcionamiento de un trabajador digital autónomo.

El objetivo comercial es transmitir tres conceptos:

- Menos trabajo administrativo.
- Menos costes operativos.
- Mayor capacidad de gestionar clientes con la misma plantilla.

## 2. Caso de uso

Una gestoría recibe un correo electrónico de uno de sus clientes con diferentes documentos adjuntos relacionados con su contabilidad mensual.

Actualmente, un trabajador debe abrir el correo, descargar los documentos, interpretarlos, clasificarlos, extraer información, introducir datos en diferentes sistemas, comprobar el historial y solicitar documentación pendiente.

Chromix debe ejecutar este workflow de forma autónoma, dejando las excepciones y las decisiones relevantes para revisión humana.

## 3. Datos de la demostración

Crear un entorno empresarial ficticio con:

- Una gestoría.
- Cinco clientes ficticios.
- Historial documental de los últimos seis meses.
- Datos fiscales de cada cliente.
- Facturas recurrentes.
- Proveedores habituales.
- Documentación histórica.
- Reglas y procedimientos internos de la gestoría.

Crear documentos PDF e imágenes realistas, no únicamente archivos de texto con extensiones simuladas.

El escenario principal será un correo de un cliente llamado Construccions Martínez SL.

Asunto: Documentación contable de noviembre.

Contenido: Buenos días, os adjunto las facturas de este mes. Creo que están todas.

Documentos adjuntos:

- Factura de electricidad.
- Factura de proveedor.
- Ticket de combustible.
- Factura de telefonía.
- Factura duplicada de un proveedor.

En el historial del cliente existe una factura mensual recurrente de alquiler que no ha sido recibida este mes.

El agente deberá detectar tanto la duplicidad como la posible ausencia de la factura del alquiler sin que estas incidencias estén hardcodeadas en la lógica de ejecución.

## 4. Workflow agéntico

Construir un agente funcional que disponga de herramientas para consultar información y ejecutar acciones.

El agente debe ser capaz de:

1. Recibir e interpretar el correo electrónico.
2. Identificar al cliente en la base de datos.
3. Leer los documentos adjuntos.
4. Clasificar cada documento.
5. Extraer información relevante.
6. Validar los datos fiscales y económicos.
7. Consultar el historial documental del cliente.
8. Identificar posibles duplicidades.
9. Detectar documentación recurrente que podría estar pendiente.
10. Organizar los documentos procesados.
11. Registrar los datos estructurados.
12. Preparar un correo personalizado solicitando la documentación pendiente.
13. Generar tareas de revisión humana cuando corresponda.
14. Elaborar un resumen del expediente.

El agente debe decidir qué herramientas utilizar en función de la información disponible y del estado del expediente.

Las decisiones del agente deben basarse en los documentos, el contexto empresarial, el historial y los resultados obtenidos mediante sus herramientas.

No simular las decisiones del agente mediante respuestas predefinidas.

Utilizar validaciones deterministas para operaciones como cálculos económicos, comprobaciones de identificadores y detección de coincidencias exactas.

Si el agente no puede verificar determinada información, debe marcarla como pendiente de revisión en lugar de inventarla.

## 5. Herramientas del agente

Implementar herramientas independientes que permitan:

- Consultar clientes.
- Consultar información fiscal.
- Leer documentos PDF e imágenes.
- Extraer información documental.
- Consultar documentos históricos.
- Buscar facturas similares.
- Comprobar duplicidades.
- Consultar patrones de documentación recurrente.
- Registrar documentos.
- Crear expedientes.
- Preparar borradores de correo.
- Crear tareas de revisión humana.
- Registrar eventos de ejecución.
- Finalizar el expediente.

Las herramientas deben tener interfaces claras, entradas y salidas estructuradas y manejo de errores.

Diseñar la arquitectura para que posteriormente puedan conectarse a servicios de correo electrónico, ERPs, CRMs y aplicaciones contables reales.

En esta primera versión, utilizar integraciones locales o simuladas. No enviar correos reales ni modificar sistemas externos.

## 6. Output del agente

Al finalizar el proceso, el sistema debe generar un expediente que contenga:

- Cliente identificado.
- Documentos recibidos.
- Documentos correctamente procesados.
- Datos fiscales y económicos extraídos.
- Clasificación documental.
- Importe de las facturas válidas.
- Documentos duplicados.
- Documentación potencialmente pendiente.
- Incidencias detectadas.
- Borrador de correo para el cliente.
- Acciones realizadas automáticamente.
- Acciones pendientes de validación humana.
- Tiempo real de ejecución del agente.

Cada resultado debe estar asociado a su documento o fuente original.

El agente no debe contabilizar dos veces una factura duplicada.

## 7. Concepto UI/UX

La aplicación debe diseñarse específicamente como una herramienta de demostración comercial.

El empresario debe entender qué está sucediendo sin necesidad de explicaciones técnicas.

La experiencia debe contar una historia:

ENTRA TRABAJO → CHROMIX TRABAJA → SALE TRABAJO RESUELTO.

Construir una interfaz de pantalla única, con una ejecución guiada y progresiva.

No construir una aplicación con múltiples menús, configuraciones complejas o funcionalidades innecesarias.

No utilizar una interfaz de chatbot.

## 8. Diseño visual

Crear una interfaz SaaS premium, minimalista, moderna y profesional.

Referencias estéticas: Linear, Stripe, Vercel y aplicaciones empresariales modernas.

Características visuales:

- Fondo blanco o gris muy claro.
- Tarjetas limpias.
- Bordes sutiles.
- Espacios generosos.
- Tipografía sans serif moderna.
- Iconografía minimalista.
- Jerarquía visual clara.
- Números grandes para indicadores empresariales.
- Verde para acciones completadas.
- Ámbar para elementos pendientes de revisión.
- Rojo para errores relevantes.
- Animaciones suaves y funcionales.

Evitar:

- Gradientes exagerados.
- Estética futurista.
- Robots ilustrados.
- Elementos decorativos innecesarios.
- Terminología técnica.
- Exceso de información.
- Dashboards con decenas de métricas.

La aplicación debe transmitir orden, eficiencia, autonomía y control.

Toda la interfaz debe estar en español.

## 9. Estructura de la pantalla

### Header

Incluir:

- Identidad visual de Chromix.
- Título: Agente de gestión documental.
- Subtítulo: De documentación recibida a expediente procesado.
- Botón principal: Ejecutar demostración.
- Botón secundario: Reiniciar.

### Indicadores superiores

Mostrar cuatro indicadores que se actualicen durante la ejecución:

- Documentos procesados.
- Incidencias detectadas.
- Acciones realizadas.
- Tiempo de trabajo recuperado estimado.

Los indicadores deben empezar en cero y actualizarse a partir de los eventos reales del agente.

### Layout principal

Dividir la pantalla en tres columnas.

#### Columna izquierda: Entrada del cliente

Representa el trabajo que recibe actualmente la gestoría.

Mostrar:

- Correo electrónico original.
- Nombre del cliente.
- Asunto.
- Contenido del mensaje.
- Documentos adjuntos.
- Vista previa de los documentos.
- Tipo y nombre de cada archivo.

Los documentos deben cambiar visualmente de estado según el agente los vaya procesando.

Título de la sección: El trabajo que recibís.

Subtítulo: Documentación enviada por vuestros clientes.

#### Columna central: Chromix trabajando

Representa el trabajo que está realizando el agente.

Mostrar un timeline vertical dinámico.

Cada acción del agente debe aparecer progresivamente mediante eventos reales del backend.

Ejemplos de mensajes:

- Identificando al cliente.
- Cliente identificado: Construccions Martínez SL.
- Leyendo la factura de electricidad.
- Extrayendo información económica.
- Consultando documentación histórica.
- Comprobando posibles duplicidades.
- Factura duplicada detectada.
- Revisando documentación recurrente.
- Posible factura de alquiler pendiente.
- Preparando correo para el cliente.
- Organizando el expediente.
- Expediente listo para revisión.

Cada actividad debe tener un estado visual:

- Pendiente.
- En ejecución.
- Completada.
- Requiere revisión.
- Error.

Resaltar visualmente la acción que se está ejecutando.

Mostrar únicamente acciones y resultados verificables, no razonamientos internos del modelo.

No mostrar prompts, tokens, llamadas API, JSON, nombres técnicos de herramientas ni información propia de desarrolladores.

Título de la sección: Chromix trabaja por vosotros.

Subtítulo: Procesamiento autónomo del expediente.

#### Columna derecha: Resultado

Representa el trabajo que ya no tiene que realizar el empleado.

Mostrar progresivamente:

- Expediente generado.
- Documentación organizada.
- Facturas válidas.
- Datos extraídos.
- Importe total.
- Factura duplicada detectada.
- Posible documento pendiente.
- Correo preparado.
- Tareas pendientes de revisión humana.

Incluir una tarjeta destacada con el borrador del correo:

Buenos días, hemos recibido y procesado vuestra documentación de noviembre. Según el historial de meses anteriores, parece que todavía no hemos recibido la factura del alquiler. ¿Podríais enviárnosla?

Incluir botones funcionales para aprobar, editar o rechazar el borrador.

La aprobación debe registrar la acción localmente, sin enviar un correo real.

Título de la sección: Trabajo listo para revisar.

Subtítulo: Tu equipo solo interviene donde aporta valor.

## 10. Experiencia de ejecución

La demostración debe funcionar de la siguiente manera:

Estado inicial:

El correo y sus documentos están visibles. El agente todavía no ha comenzado a trabajar.

El empresario puede entender qué documentación acaba de recibir la gestoría.

Al pulsar Ejecutar demostración:

- Se inicia el agente real.
- Aparecen progresivamente sus actividades.
- Se destacan los documentos que está procesando.
- Se actualizan los indicadores.
- Aparecen los resultados parciales.
- Se muestran las incidencias cuando son detectadas.
- Se generan las acciones correspondientes.
- Se completa el expediente.

Estado final:

La interfaz muestra claramente qué trabajo ha realizado el agente y qué necesita revisar el empleado.

Debe existir un modo de presentación guiada que permita avanzar o pausar la visualización de los eventos sin falsificar el tiempo real de ejecución.

El usuario debe poder reiniciar y ejecutar la demostración nuevamente.

La experiencia debe ser visual, dinámica y fácil de narrar durante una reunión comercial.

## 11. Comparativa antes y después

Al finalizar la ejecución, mostrar un bloque de impacto empresarial.

Título: El impacto en vuestra empresa.

Comparativa:

Antes de Chromix:

- Abrir correos.
- Descargar documentos.
- Interpretar facturas.
- Introducir datos.
- Consultar históricos.
- Detectar errores.
- Reclamar documentación.

Con Chromix:

- Revisar incidencias.
- Validar resultados.

Mostrar una comparativa visual de tiempos basada inicialmente en las siguientes hipótesis:

- Procesamiento manual: 15 minutos por expediente.
- Trabajo humano con Chromix: 2 minutos por expediente.
- Tiempo humano recuperado: 13 minutos.
- Reducción estimada del trabajo manual: 87%.

Diferenciar claramente el tiempo real de ejecución del agente del tiempo estimado de intervención humana.

Identificar las cifras comerciales como estimaciones, no como resultados demostrados.

## 12. Calculadora de impacto económico

Incluir una pequeña calculadora interactiva al finalizar la demostración.

Campos editables:

- Expedientes procesados diariamente.
- Minutos de trabajo manual por expediente.
- Minutos de revisión humana con Chromix.
- Coste laboral por hora.
- Días laborables al año.

Calcular automáticamente:

- Horas recuperadas diariamente.
- Horas recuperadas mensualmente.
- Horas recuperadas anualmente.
- Valor económico anual de la capacidad recuperada.
- Capacidad equivalente de trabajadores a jornada completa.

Utilizar gráficos comparativos simples y números grandes.

Diferenciar capacidad productiva recuperada de ahorro económico efectivo.

El empresario debe poder introducir sus propios datos durante la reunión para visualizar el impacto potencial en su empresa.

## 13. Arquitectura técnica

Antes de comenzar, analiza el repositorio existente y reutiliza sus tecnologías y convenciones cuando sea posible.

Si no existe una arquitectura previa, utiliza una arquitectura sencilla, modular y mantenible.

Tecnologías sugeridas:

- Frontend: React, TypeScript y Tailwind CSS.
- Componentes UI: shadcn/ui.
- Iconos: Lucide.
- Animaciones: Framer Motion.
- Backend: Python y FastAPI.
- Base de datos: SQLite.
- Agente: Claude API con tool calling.
- Comunicación de eventos: Server-Sent Events o WebSockets.

Separar claramente:

- Interfaz de usuario.
- Orquestación agéntica.
- Herramientas del agente.
- Procesamiento documental.
- Persistencia.
- Validaciones.
- Eventos de ejecución.
- Métricas.
- Datos de demostración.

Permitir configurar el proveedor y modelo de inteligencia artificial sin modificar la lógica empresarial.

Mantener las claves API exclusivamente en el backend.

## 14. Fiabilidad del agente

Implementar:

- Salidas estructuradas.
- Validación de esquemas.
- Manejo de errores.
- Reintentos controlados.
- Límites de ejecución.
- Trazabilidad de acciones.
- Prevención de registros duplicados.
- Supervisión humana.
- Protección frente a instrucciones maliciosas contenidas en documentos o correos.
- Tratamiento de documentos como datos no confiables.

Crear tests y evaluaciones del agente que comprueben:

- Identificación correcta del cliente.
- Clasificación documental.
- Extracción correcta de importes.
- Detección de duplicidades.
- Detección de documentación pendiente.
- Uso correcto de herramientas.
- Ausencia de datos inventados.
- Generación correcta del expediente.
- Gestión de documentos ilegibles.
- Gestión de clientes desconocidos.
- Gestión de errores durante la ejecución.

## 15. Alcance del MVP

La prioridad absoluta es construir una demostración comercial convincente.

No implementar inicialmente:

- Autenticación compleja.
- Multi-tenancy.
- Integraciones reales con ERPs.
- Envío real de correos.
- Contabilidad completa.
- Gestión avanzada de permisos.
- Infraestructura cloud compleja.
- Sistemas de pago.

Utilizar exclusivamente datos ficticios.

La arquitectura debe permitir evolucionar posteriormente hacia un producto empresarial real.

## 16. Instrucciones de implementación

No te limites a generar un documento de arquitectura o un plan de trabajo.

Construye la aplicación funcional.

1. Analiza el proyecto existente.
2. Define la arquitectura mínima necesaria.
3. Genera los datos y documentos de demostración.
4. Implementa las herramientas.
5. Implementa el agente.
6. Implementa el workflow.
7. Implementa el frontend.
8. Conecta los eventos reales del agente a la interfaz.
9. Implementa la calculadora de impacto.
10. Ejecuta los tests.
11. Comprueba el funcionamiento completo de la demostración.
12. Revisa visualmente la interfaz y corrige problemas de diseño y usabilidad.

Prioriza una experiencia completa de principio a fin frente a añadir funcionalidades adicionales.

El resultado debe ser una aplicación que pueda abrir en mi portátil, visitar una gestoría, pulsar un botón y demostrar visualmente cómo Chromix puede eliminar gran parte de su trabajo administrativo repetitivo.

El mensaje comercial final de la aplicación debe ser:

**Menos trabajo administrativo. Más capacidad para hacer crecer vuestro negocio.**
