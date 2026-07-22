import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { EMPRESA } from "@/data/empresa";

export const metadata: Metadata = {
  title: `Términos y condiciones — ${EMPRESA.marca}`,
  description: `Condiciones de uso del sitio web informativo ${EMPRESA.webDominio}.`,
};

export default function TerminosYCondicionesPage() {
  return (
    <LegalLayout
      title="Términos y condiciones de uso"
      intro={`Las presentes condiciones regulan el acceso y uso del sitio web ${EMPRESA.webDominio}, de carácter exclusivamente informativo. Este sitio no es una tienda online: a través de él no se venden productos ni se contratan servicios.`}
    >
      <h2>1. Identificación del titular</h2>
      <p>
        El titular de este sitio web es <strong>{EMPRESA.razonSocial}</strong>,
        con domicilio en {EMPRESA.domicilio} (en adelante, &quot;
        {EMPRESA.marca}&quot;).
      </p>

      <h2>2. Objeto del sitio web</h2>
      <p>
        {EMPRESA.webDominio} tiene una finalidad exclusivamente informativa:
        dar a conocer a qué se dedica {EMPRESA.marca} y qué tipo de servicios
        ofrece (consultoría de procesos, automatización, soluciones con
        inteligencia artificial y desarrollo web), mostrar ejemplos y
        demostraciones, y facilitar vías de contacto.
      </p>
      <p>
        A través de este sitio web <strong>no se realiza ninguna venta ni
        contratación</strong>. Cualquier eventual prestación de servicios se
        acordará fuera del sitio web, mediante propuesta o contrato específico
        entre las partes, con sus propias condiciones.
      </p>

      <h2>3. Uso del sitio</h2>
      <p>
        El usuario se compromete a hacer un uso lícito del sitio, de sus
        contenidos y del asistente conversacional, y a no realizar actividades
        que puedan dañar, sobrecargar o deteriorar el sitio o impedir su normal
        funcionamiento.
      </p>

      <h2>4. Asistente conversacional con IA</h2>
      <p>
        El sitio incorpora un asistente conversacional (&quot;Kromi&quot;)
        basado en <strong>inteligencia artificial</strong>. Sus respuestas se
        generan automáticamente, tienen carácter meramente orientativo y pueden
        contener errores o imprecisiones. No constituyen asesoramiento
        profesional ni oferta contractual. El tratamiento de los datos
        facilitados al asistente se describe en la{" "}
        <a href="/politica-de-privacidad">Política de privacidad</a>.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los contenidos de este sitio (textos, imágenes, logotipos, diseño y
        código) son titularidad de {EMPRESA.marca} o se usan con autorización
        de sus titulares. No está permitida su reproducción, distribución o
        transformación sin autorización expresa, salvo los usos permitidos por
        la ley.
      </p>

      <h2>6. Enlaces</h2>
      <p>
        Este sitio puede contener enlaces a sitios de terceros (por ejemplo,
        redes sociales o WhatsApp). {EMPRESA.marca} no se hace responsable del
        contenido ni de las políticas de dichos sitios.
      </p>

      <h2>7. Responsabilidad</h2>
      <p>
        {EMPRESA.marca} procura que la información publicada sea correcta y
        esté actualizada, pero no garantiza la ausencia de errores ni la
        disponibilidad ininterrumpida del sitio, y no responderá de los daños
        derivados del uso de la información aquí contenida, que tiene carácter
        exclusivamente informativo.
      </p>

      <h2>8. Protección de datos</h2>
      <p>
        El tratamiento de los datos personales recogidos a través del sitio
        (formularios, asistente conversacional, canales de contacto) se rige
        por nuestra{" "}
        <a href="/politica-de-privacidad">Política de privacidad</a> y nuestra{" "}
        <a href="/politica-de-cookies">Política de cookies</a>.
      </p>

      <h2>9. Modificaciones</h2>
      <p>
        {EMPRESA.marca} se reserva el derecho a modificar estas condiciones en
        cualquier momento. La versión vigente será la publicada en cada momento
        en este sitio web.
      </p>

      <h2>10. Legislación aplicable y jurisdicción</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para la
        resolución de cualquier controversia, las partes se someten, con
        renuncia expresa a cualquier otro fuero, a los Juzgados y Tribunales de
        Vic (Barcelona), salvo que la normativa imperativa aplicable disponga
        otra cosa.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para cualquier consulta sobre estas condiciones puedes escribirnos a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> o llamarnos al{" "}
        <a href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefono}</a>.
      </p>
    </LegalLayout>
  );
}
