import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { EMPRESA } from "@/data/empresa";

export const metadata: Metadata = {
  title: `Términos y condiciones — ${EMPRESA.marca}`,
  description: `Condiciones generales que regulan los servicios de consultoría y desarrollo prestados por ${EMPRESA.razonSocial}.`,
};

export default function TerminosYCondicionesPage() {
  return (
    <LegalLayout
      title="Términos y condiciones"
      intro={`Las presentes condiciones generales regulan la relación entre ${EMPRESA.razonSocial} y sus clientes en relación con los servicios de consultoría tecnológica, automatización y desarrollo de soluciones a medida ofrecidos a través de ${EMPRESA.webDominio}.`}
    >
      <h2>1. Identificación del prestador</h2>
      <p>
        Los servicios son prestados por <strong>{EMPRESA.razonSocial}</strong>,
        con CIF {EMPRESA.cif} y domicilio en {EMPRESA.domicilio} (en adelante,
        &quot;{EMPRESA.marca}&quot;).
      </p>

      <h2>2. Objeto</h2>
      <p>
        {EMPRESA.marca} ofrece servicios de:
      </p>
      <ul>
        <li>Diagnóstico operativo y consultoría de procesos.</li>
        <li>
          Diseño, desarrollo e implantación de automatizaciones e integraciones
          a medida.
        </li>
        <li>
          Desarrollo de soluciones de software basadas en inteligencia
          artificial.
        </li>
        <li>Mantenimiento, soporte y evolución de las soluciones entregadas.</li>
      </ul>
      <p>
        El alcance concreto de cada servicio se definirá en una propuesta o
        contrato específico aceptado por ambas partes (en adelante, el
        &quot;Encargo&quot;).
      </p>

      <h2>3. Aceptación</h2>
      <p>
        La contratación de cualquier servicio implica la aceptación íntegra de
        estos términos y condiciones, así como del Encargo concreto. Las
        condiciones particulares pactadas en el Encargo prevalecerán sobre las
        generales en caso de contradicción.
      </p>

      <h2>4. Precios y forma de pago</h2>
      <p>
        Los precios de cada Encargo se especificarán en la propuesta económica.
        Salvo pacto en contrario:
      </p>
      <ul>
        <li>Los precios se expresan en euros y no incluyen IVA.</li>
        <li>
          Los proyectos se facturan habitualmente en hitos: 40% al inicio, 30%
          a mitad de proyecto y 30% a la entrega.
        </li>
        <li>
          Los servicios recurrentes (soporte, mantenimiento) se facturan de
          forma mensual o trimestral según se acuerde.
        </li>
        <li>
          El plazo de pago de las facturas será de <strong>15 días naturales</strong>{" "}
          desde su emisión, salvo pacto distinto.
        </li>
      </ul>

      <h2>5. Plazos y entregables</h2>
      <p>
        Los plazos indicados en cada Encargo son orientativos y dependen de la
        colaboración del cliente para facilitar la información, los accesos y
        las validaciones necesarias. Cualquier retraso imputable al cliente
        ampliará proporcionalmente los plazos de entrega.
      </p>

      <h2>6. Obligaciones del cliente</h2>
      <ul>
        <li>
          Designar un interlocutor único con capacidad de decisión sobre el
          Encargo.
        </li>
        <li>
          Facilitar de forma puntual la información, accesos y autorizaciones
          necesarios para la correcta ejecución del Encargo.
        </li>
        <li>
          Validar los entregables en los plazos previstos. Transcurridos
          <strong> 10 días naturales</strong> sin observaciones formales por
          escrito, los entregables se entenderán aceptados.
        </li>
        <li>Cumplir con los pagos en los plazos acordados.</li>
      </ul>

      <h2>7. Propiedad intelectual</h2>
      <p>
        Salvo pacto expreso en contrario, una vez satisfecho el precio íntegro
        del Encargo, {EMPRESA.marca} cederá al cliente los derechos de uso,
        reproducción y modificación del software desarrollado a medida para él.
        Quedarán excluidos de esta cesión:
      </p>
      <ul>
        <li>
          Componentes preexistentes propiedad de {EMPRESA.marca} (librerías,
          frameworks internos, plantillas), sobre los que el cliente recibirá
          una licencia no exclusiva, perpetua e intransferible para uso interno.
        </li>
        <li>
          Componentes de terceros incorporados al desarrollo, que se regirán por
          sus propias licencias.
        </li>
      </ul>

      <h2>8. Confidencialidad</h2>
      <p>
        Ambas partes se obligan a guardar absoluta confidencialidad sobre toda
        información de la otra parte a la que tengan acceso con motivo del
        Encargo. Esta obligación se mantendrá vigente durante la prestación del
        servicio y los <strong>cinco (5) años</strong> posteriores a su
        finalización.
      </p>

      <h2>9. Protección de datos</h2>
      <p>
        Cuando la prestación del servicio implique el acceso de {EMPRESA.marca}
        a datos personales responsabilidad del cliente, las partes firmarán el
        correspondiente contrato de encargo de tratamiento conforme al art. 28
        del RGPD. Para más información sobre cómo {EMPRESA.marca} trata datos
        personales propios, consulta nuestra{" "}
        <a href="/politica-de-privacidad">Política de privacidad</a>.
      </p>

      <h2>10. Garantía y soporte</h2>
      <p>
        {EMPRESA.marca} garantiza el correcto funcionamiento de los desarrollos
        entregados durante un periodo de <strong>30 días naturales</strong>{" "}
        desde su aceptación. Durante este periodo, corregiremos sin coste
        adicional cualquier defecto reproducible que afecte a las
        funcionalidades pactadas. Quedan excluidas de la garantía las
        modificaciones realizadas por el cliente o por terceros sin nuestra
        autorización.
      </p>

      <h2>11. Limitación de responsabilidad</h2>
      <p>
        La responsabilidad total de {EMPRESA.marca} por cualquier reclamación
        derivada de un Encargo se limita al importe efectivamente abonado por el
        cliente por dicho Encargo en los doce (12) meses anteriores al hecho
        causante de la reclamación. {EMPRESA.marca} no responderá en ningún caso
        de daños indirectos, lucro cesante o pérdida de datos cuya
        responsabilidad no le sea directamente imputable.
      </p>

      <h2>12. Resolución del contrato</h2>
      <p>
        Cualquiera de las partes podrá resolver el contrato por incumplimiento
        grave de la otra, previa notificación por escrito y plazo de subsanación
        de quince (15) días naturales. La resolución no eximirá al cliente del
        pago de los servicios efectivamente prestados hasta la fecha.
      </p>

      <h2>13. Modificaciones</h2>
      <p>
        {EMPRESA.marca} se reserva el derecho a modificar estos términos en
        cualquier momento. Las nuevas versiones se aplicarán a los Encargos
        firmados con posterioridad a su publicación. Para los Encargos en curso
        se aplicará la versión vigente en el momento de su firma.
      </p>

      <h2>14. Legislación aplicable y jurisdicción</h2>
      <p>
        Estos términos y condiciones se rigen por la legislación española. Para
        la resolución de cualquier controversia, las partes se someten, con
        renuncia expresa a cualquier otro fuero, a los Juzgados y Tribunales de
        Vic (Barcelona), salvo que la normativa imperativa aplicable disponga
        otra cosa.
      </p>

      <h2>15. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos términos puedes escribirnos a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> o llamarnos al{" "}
        <a href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefono}</a>.
      </p>
    </LegalLayout>
  );
}
