export interface CasoDeUso {
  titulo: string;
  categoria: "Simple" | "Medio" | "Complejo";
  problema: string;
  solucion: string;
  horasPerdidas: string;
  inversion: string;
  ahorro: string;
  recuperacion: string;
}

export const CASOS: CasoDeUso[] = [
  {
    titulo: "Asesoría — Documentos por email",
    categoria: "Simple",
    problema:
      "Abren cada email, descargan el adjunto, lo renombran y lo mueven a la carpeta del cliente. 30–50 veces al día. Documentos mal archivados y tiempo perdido buscando cosas que estaban «en algún sitio».",
    solucion:
      "El sistema lee los emails que llegan, identifica qué tipo de documento es, lo nombra correctamente y lo guarda en la carpeta del cliente que corresponde. Sin que nadie lo toque. Los casos urgentes se notifican de forma prioritaria.",
    horasPerdidas: "6–8h/semana",
    inversion: "1.500–3.000€",
    ahorro: "~700€/mes",
    recuperacion: "2–4 meses",
  },
  {
    titulo: "Empresa de servicios — Facturación a fin de mes",
    categoria: "Simple",
    problema:
      "Alguien tiene que revisar todos los trabajos del mes, calcular qué corresponde facturar a cada cliente y generar las facturas una a una. Se olvidan trabajos, se factura tarde y los errores generan reclamaciones.",
    solucion:
      "Cada vez que se cierra un trabajo, el sistema lo registra y lo acumula. Al llegar la fecha de facturación, las facturas se generan solas con los datos correctos y se envían al cliente sin intervención manual.",
    horasPerdidas: "8–12h/mes en cierre de facturación",
    inversion: "1.200–2.500€",
    ahorro: "~500€/mes",
    recuperacion: "2–4 meses",
  },
  {
    titulo: "Servicios — Llamadas y mensajes sin respuesta a tiempo",
    categoria: "Medio",
    problema:
      "Llegan llamadas perdidas, emails y WhatsApps pidiendo presupuesto. Nadie está pendiente en tiempo real y pasan horas hasta que alguien responde. Cuando contestamos, el cliente ya se ha ido a la competencia. No lo perdemos por precio: lo perdemos por velocidad de respuesta.",
    solucion:
      "Cada contacto que entra por teléfono, email o WhatsApp recibe al instante una respuesta automática y queda registrado. A la vez nos avisa en el móvil con un resumen y la urgencia. Si nadie retoma el hilo, el sistema vuelve a avisar y escala al responsable antes de que el cliente se enfríe.",
    horasPerdidas: "5–10 contactos potenciales perdidos/mes por contestar tarde",
    inversion: "2.000–4.000€",
    ahorro: "Variable según oportunidades recuperadas",
    recuperacion: "1–3 meses",
  },
  {
    titulo: "Distribuidora — Pedidos por WhatsApp",
    categoria: "Medio",
    problema:
      "Los pedidos se pierden entre mensajes, los comerciales copian los datos a mano en el sistema de gestión, el almacén no se actualiza hasta que alguien lo introduce y cuando alguien falta, el caos está garantizado.",
    solucion:
      "Los pedidos que llegan por WhatsApp o email se detectan solos. Se extrae cliente, producto y cantidad, y entran directamente en el sistema de gestión. Nadie los copia a mano. El almacén se actualiza en tiempo real.",
    horasPerdidas: "15–20h/semana entre 2–3 personas",
    inversion: "2.000–4.000€",
    ahorro: "~1.200€/mes",
    recuperacion: "2–3 meses",
  },
  {
    titulo: "Servicios entre empresas — Contactos potenciales perdidos",
    categoria: "Medio",
    problema:
      "Los contactos llegan por web, email y teléfono y nadie sabe de quién es la responsabilidad. Sin respuesta en 48 horas el contacto se enfría. Si el comercial que lo llevaba se va, el historial desaparece con él.",
    solucion:
      "Cada contacto que llega, venga de donde venga, se registra automáticamente, se asigna a un comercial y genera una tarea con plazo. Si no hay respuesta en 24 horas, salta una alerta. Todo el historial queda guardado.",
    horasPerdidas: "5–10 contactos perdidos/mes → 5.000–15.000€ de facturación potencial no capturada",
    inversion: "2.500–5.000€",
    ahorro: "Variable según contactos recuperados",
    recuperacion: "Primer mes",
  },
  {
    titulo: "Constructora — Presupuestos en Word",
    categoria: "Medio",
    problema:
      "Cada presupuesto se hace desde cero copiando el anterior, ajustando precios a mano y calculando márgenes con la calculadora. Un error arrastra errores en todo el documento. Si el cliente pide un cambio hay que rehacer todo.",
    solucion:
      "El comercial selecciona partidas, materiales y cantidades en una herramienta estructurada. El sistema calcula el total, aplica los márgenes configurados y genera el documento listo para enviar. Los cambios se actualizan en segundos.",
    horasPerdidas: "4–8h/semana en elaboración y revisión",
    inversion: "2.000–3.500€",
    ahorro: "~800€/mes",
    recuperacion: "3–4 meses",
  },
  {
    titulo: "Empresa industrial — Sin visibilidad financiera",
    categoria: "Complejo",
    problema:
      "Para saber si el mes va bien hay que llamar al contable, al responsable de producción y mirar tres hojas de cálculo distintas. Cerrar el mes lleva días. Se toman decisiones sin saber realmente cuánto gana cada cliente.",
    solucion:
      "Todos los sistemas (gestión, hojas de cálculo, etc.) conectados a un panel único. El director ve en tiempo real ingresos, márgenes por cliente y qué proyectos están en pérdidas. Sin llamar a nadie, sin esperar al cierre.",
    horasPerdidas: "30–40h/mes entre dirección y administración",
    inversion: "4.000–8.000€",
    ahorro: "~1.200€/mes",
    recuperacion: "4–6 meses",
  },
  {
    titulo: "Comercio híbrido — Almacén desincronizado",
    categoria: "Complejo",
    problema:
      "Clientes que compran en línea algo ya agotado en tienda. Recuentos manuales cada semana para cuadrar el sistema con la realidad. Roturas de almacén que no se detectan hasta que el cliente llama o el almacén está vacío.",
    solucion:
      "Las ventas de tienda y tienda en línea se registran en el mismo sistema en tiempo real. Cuando el almacén baja del mínimo configurado, llega un aviso automático. Se acabaron los recuentos manuales y las sorpresas.",
    horasPerdidas: "4–6h/semana en recuentos + coste de roturas no detectadas",
    inversion: "3.000–6.000€",
    ahorro: "~750€/mes",
    recuperacion: "4–6 meses",
  },
  {
    titulo: "Empresa de transporte — Albaranes en papel",
    categoria: "Complejo",
    problema:
      "Los conductores llevan albaranes en papel que al final del día entregan en la oficina. Alguien los introduce a mano en el sistema. Se pierden, llegan ilegibles. Si un cliente reclama una entrega, hay que buscar entre papeles.",
    solucion:
      "Los conductores confirman las entregas desde el móvil: el cliente firma en pantalla y todo queda registrado al instante. En la oficina se ve en tiempo real qué está entregado y qué no, sin esperar al final del día.",
    horasPerdidas: "6–10h/semana entre conductores y administración",
    inversion: "3.500–6.000€",
    ahorro: "~900€/mes",
    recuperacion: "4–6 meses",
  },
];
