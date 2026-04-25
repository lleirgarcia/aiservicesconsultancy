import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { EMPRESA } from "@/data/empresa";

export const metadata: Metadata = {
  title: `Aviso legal — ${EMPRESA.marca}`,
  description: `Información legal sobre el sitio ${EMPRESA.webDominio}, titularidad y condiciones de uso.`,
};

export default function AvisoLegalPage() {
  return (
    <LegalLayout
      title="Aviso legal"
      intro={`En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), te facilitamos a continuación los datos identificativos del titular de ${EMPRESA.webDominio} y las condiciones de uso del sitio.`}
    >
      <h2>1. Datos identificativos del titular</h2>
      <p>
        El presente sitio web {EMPRESA.webDominio} (en adelante, el &quot;Sitio
        Web&quot;) es titularidad de:
      </p>
      <ul>
        <li>
          <strong>Razón social:</strong> {EMPRESA.razonSocial}
        </li>
        <li>
          <strong>Nombre comercial:</strong> {EMPRESA.marca}
        </li>
        <li>
          <strong>CIF:</strong> {EMPRESA.cif}
        </li>
        <li>
          <strong>Domicilio social:</strong> {EMPRESA.domicilio}
        </li>
        <li>
          <strong>Datos registrales:</strong> {EMPRESA.registro}
        </li>
        <li>
          <strong>Correo electrónico:</strong>{" "}
          <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>
        </li>
        <li>
          <strong>Teléfono:</strong>{" "}
          <a href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefono}</a>
        </li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        El Sitio Web tiene por objeto presentar a {EMPRESA.marca} y sus servicios
        de consultoría tecnológica, automatización de procesos, integración de
        sistemas y desarrollo de soluciones a medida basadas en inteligencia
        artificial dirigidos a empresas. Asimismo, ofrece formularios y un
        asistente conversacional para que cualquier persona interesada pueda
        contactar con nosotros.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El acceso y la utilización del Sitio Web atribuyen la condición de usuario
        e implican la aceptación plena y sin reservas de todas las disposiciones
        incluidas en este Aviso legal, en la versión publicada en cada momento.
      </p>
      <p>
        El usuario se compromete a hacer un uso adecuado de los contenidos,
        servicios y herramientas que {EMPRESA.marca} ofrece a través de su Sitio
        Web y a no emplearlos para realizar actividades ilícitas, lesivas de
        derechos o intereses de terceros o que de cualquier forma puedan dañar,
        inutilizar, sobrecargar o impedir el uso normal del Sitio Web.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del Sitio Web (textos, fotografías, gráficos,
        imágenes, iconos, tecnología, software, así como su diseño gráfico y
        códigos fuente) constituyen una obra cuya propiedad pertenece a{" "}
        {EMPRESA.razonSocial} o, en su caso, a terceros que han autorizado su
        uso, sin que pueda entenderse cedido al usuario ninguno de los derechos
        de explotación reconocidos por la normativa vigente en materia de
        propiedad intelectual.
      </p>
      <p>
        Las marcas, nombres comerciales o signos distintivos son titularidad de{" "}
        {EMPRESA.razonSocial} o de terceros, sin que pueda entenderse que el
        acceso al Sitio Web atribuye derecho alguno sobre las citadas marcas,
        nombres comerciales o signos distintivos.
      </p>

      <h2>5. Enlaces a sitios de terceros</h2>
      <p>
        El Sitio Web puede contener enlaces a otras páginas web. {EMPRESA.marca}{" "}
        no se hace responsable del contenido, exactitud o políticas de privacidad
        de dichos sitios y la inclusión de enlaces no implica recomendación,
        respaldo o asociación con sus titulares.
      </p>

      <h2>6. Exclusión de garantías y de responsabilidad</h2>
      <p>
        {EMPRESA.marca} no garantiza la disponibilidad y continuidad permanente
        del funcionamiento del Sitio Web ni la utilidad del Sitio Web para la
        realización de ninguna actividad concreta. {EMPRESA.marca} excluye, con
        toda la extensión permitida por el ordenamiento jurídico, cualquier
        responsabilidad por los daños y perjuicios de toda naturaleza que puedan
        deberse a la falta de disponibilidad o de continuidad del funcionamiento
        del Sitio Web y de los servicios habilitados en él.
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        {EMPRESA.marca} se reserva el derecho a efectuar, sin previo aviso, las
        modificaciones que considere oportunas en el Sitio Web, pudiendo cambiar,
        suprimir o añadir tanto los contenidos y servicios como la forma en que
        éstos aparezcan presentados o localizados en sus servidores.
      </p>

      <h2>8. Legislación aplicable y jurisdicción</h2>
      <p>
        Las relaciones establecidas entre {EMPRESA.marca} y el usuario se regirán
        por la normativa española vigente. Salvo que la legislación aplicable
        disponga otra cosa, las partes, con renuncia expresa a cualquier otro
        fuero que pudiera corresponderles, se someten a los Juzgados y Tribunales
        de Vic (Barcelona) para resolver cualquier controversia que pudiera
        surgir.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier duda o consulta sobre este Aviso legal puedes escribir a{" "}
        <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> o llamar al{" "}
        <a href={`tel:${EMPRESA.telefonoTel}`}>{EMPRESA.telefono}</a>.
      </p>
    </LegalLayout>
  );
}
