import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { EMPRESA } from "@/data/empresa";

export const metadata: Metadata = {
  title: `Política de privacidad — ${EMPRESA.marca}`,
  description: `Política de privacidad y tratamiento de datos personales de ${EMPRESA.marca}, conforme al Reglamento (UE) 2016/679 (RGPD) y la LOPDGDD.`,
};

export default function PoliticaDePrivacidadPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      intro={`Esta política explica cómo ${EMPRESA.razonSocial} trata los datos personales que recopila a través de ${EMPRESA.webDominio}, su asistente conversacional y los canales de contacto con sus clientes y usuarios. Cumplimos con el Reglamento (UE) 2016/679 (RGPD) y con la Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).`}
    >
      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Responsable:</strong> {EMPRESA.razonSocial} ({EMPRESA.marca})
        </li>
        <li>
          <strong>CIF:</strong> {EMPRESA.cif}
        </li>
        <li>
          <strong>Domicilio:</strong> {EMPRESA.domicilio}
        </li>
        <li>
          <strong>Correo de privacidad:</strong>{" "}
          <a href={`mailto:${EMPRESA.emailPrivacidad}`}>
            {EMPRESA.emailPrivacidad}
          </a>
        </li>
        <li>
          <strong>Delegado de Protección de Datos (DPD):</strong>{" "}
          <a href={`mailto:${EMPRESA.emailDpd}`}>{EMPRESA.emailDpd}</a>
        </li>
      </ul>

      <h2>2. Datos que tratamos y de dónde proceden</h2>
      <p>
        Tratamos exclusivamente los datos personales que tú nos facilitas
        directamente a través de:
      </p>
      <ul>
        <li>
          El asistente conversacional &quot;Kromi&quot; integrado en{" "}
          {EMPRESA.webDominio}.
        </li>
        <li>El formulario de contacto del Sitio Web.</li>
        <li>
          Los canales directos: correo electrónico, teléfono y WhatsApp, así como
          formularios en eventos comerciales o reuniones.
        </li>
        <li>
          Las cookies y tecnologías similares descritas en nuestra{" "}
          <a href="/politica-de-cookies">Política de Cookies</a>.
        </li>
      </ul>
      <p>Las categorías de datos que podemos llegar a tratar son:</p>
      <ul>
        <li>
          <strong>Datos identificativos:</strong> nombre y apellidos, empresa,
          cargo.
        </li>
        <li>
          <strong>Datos de contacto:</strong> dirección de correo electrónico,
          número de teléfono.
        </li>
        <li>
          <strong>Datos relativos a tu empresa:</strong> tamaño aproximado,
          actividad, sector, problemática o necesidad descrita.
        </li>
        <li>
          <strong>Contenido de las conversaciones:</strong> mensajes que envías
          al asistente Kromi y a nuestro equipo, incluidas grabaciones de voz
          (si has activado la transcripción por voz).
        </li>
        <li>
          <strong>Datos técnicos y de navegación:</strong> dirección IP, tipo de
          dispositivo, navegador, idioma, páginas visitadas y tiempo de
          permanencia.
        </li>
      </ul>

      <h2>3. Finalidades y bases jurídicas del tratamiento</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base jurídica (RGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Atender tus consultas, presupuestos y solicitudes de información.
            </td>
            <td>
              Art. 6.1.b) ejecución de medidas precontractuales a petición del
              interesado.
            </td>
          </tr>
          <tr>
            <td>
              Gestionar la relación comercial y contractual con clientes y
              proveedores.
            </td>
            <td>Art. 6.1.b) ejecución del contrato.</td>
          </tr>
          <tr>
            <td>
              Cumplir con las obligaciones legales (fiscales, contables,
              mercantiles).
            </td>
            <td>Art. 6.1.c) cumplimiento de una obligación legal.</td>
          </tr>
          <tr>
            <td>
              Mejorar nuestro asistente conversacional Kromi mediante el
              análisis agregado y anonimizado de las conversaciones.
            </td>
            <td>
              Art. 6.1.f) interés legítimo en evolucionar nuestros servicios.
            </td>
          </tr>
          <tr>
            <td>
              Enviarte comunicaciones comerciales sobre nuestros servicios.
            </td>
            <td>
              Art. 6.1.a) consentimiento, o art. 6.1.f) interés legítimo cuando
              ya seas cliente.
            </td>
          </tr>
          <tr>
            <td>Cookies analíticas y de mejora del Sitio Web.</td>
            <td>
              Art. 6.1.a) consentimiento expreso a través del banner de cookies.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>4. Plazo de conservación</h2>
      <p>
        Conservaremos tus datos durante el tiempo necesario para cumplir las
        finalidades para las que fueron recogidos y, en cualquier caso, durante
        los siguientes plazos:
      </p>
      <ul>
        <li>
          <strong>Consultas no convertidas en cliente:</strong> hasta 24 meses
          desde el último contacto, salvo solicitud previa de supresión.
        </li>
        <li>
          <strong>Clientes:</strong> durante toda la relación contractual y, una
          vez finalizada, durante los plazos legales de prescripción de
          responsabilidades (hasta 6 años para obligaciones mercantiles y
          fiscales).
        </li>
        <li>
          <strong>Conversaciones con el asistente Kromi:</strong> hasta 12 meses
          en formato identificable; posteriormente, se anonimizan para análisis
          agregado.
        </li>
        <li>
          <strong>Datos para marketing:</strong> hasta que retires tu
          consentimiento.
        </li>
      </ul>

      <h2>5. Destinatarios y cesiones de datos</h2>
      <p>
        Tus datos no se ceden a terceros, salvo obligación legal. Sí pueden ser
        accedidos por proveedores tecnológicos que nos prestan servicios
        (encargados del tratamiento) con los que tenemos firmado el
        correspondiente contrato del art. 28 RGPD. Las principales categorías
        son:
      </p>
      <ul>
        <li>
          Proveedores de alojamiento web e infraestructura cloud (UE/EE. UU. con
          garantías adecuadas).
        </li>
        <li>
          Proveedores de modelos de inteligencia artificial para el
          funcionamiento del asistente Kromi.
        </li>
        <li>Proveedor de base de datos para registrar leads y mensajes.</li>
        <li>Herramientas de email transaccional y comunicaciones.</li>
        <li>Asesoría fiscal, contable y jurídica.</li>
      </ul>
      <p>
        En el caso de transferencias internacionales fuera del Espacio Económico
        Europeo, éstas se realizarán a países con decisión de adecuación o, en su
        defecto, mediante Cláusulas Contractuales Tipo aprobadas por la Comisión
        Europea u otras garantías adecuadas previstas en el RGPD.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Como titular de los datos, en cualquier momento puedes ejercer los
        siguientes derechos:
      </p>
      <ul>
        <li>
          <strong>Acceso:</strong> conocer qué datos tuyos tratamos.
        </li>
        <li>
          <strong>Rectificación:</strong> corregir datos inexactos.
        </li>
        <li>
          <strong>Supresión:</strong> solicitar la eliminación cuando ya no sean
          necesarios.
        </li>
        <li>
          <strong>Oposición:</strong> oponerte a determinados tratamientos.
        </li>
        <li>
          <strong>Limitación:</strong> solicitar que se limite el tratamiento.
        </li>
        <li>
          <strong>Portabilidad:</strong> recibir tus datos en formato
          estructurado.
        </li>
        <li>
          <strong>Revocación del consentimiento</strong> en cualquier momento,
          sin efectos retroactivos.
        </li>
      </ul>
      <p>
        Para ejercer estos derechos, escríbenos a{" "}
        <a href={`mailto:${EMPRESA.emailPrivacidad}`}>
          {EMPRESA.emailPrivacidad}
        </a>{" "}
        indicando el derecho que quieres ejercer y adjuntando una copia de tu
        documento identificativo.
      </p>
      <p>
        Asimismo, tienes derecho a presentar una reclamación ante la Agencia
        Española de Protección de Datos (
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
        >
          www.aepd.es
        </a>
        ) si consideras que el tratamiento de tus datos personales infringe la
        normativa aplicable.
      </p>

      <h2>7. Decisiones automatizadas</h2>
      <p>
        Nuestro asistente conversacional Kromi utiliza modelos de inteligencia
        artificial para ofrecerte una primera valoración orientativa de tus
        necesidades. Esta interacción <strong>no constituye</strong> una
        decisión automatizada con efectos jurídicos en el sentido del art. 22
        RGPD: cualquier propuesta comercial concreta es revisada y validada por
        una persona de nuestro equipo antes de enviártela.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        {EMPRESA.razonSocial} aplica medidas técnicas y organizativas
        razonables para garantizar la seguridad e integridad de los datos
        personales, así como para evitar su pérdida, alteración o acceso por
        parte de terceros no autorizados. Estas medidas son revisadas y
        actualizadas periódicamente.
      </p>

      <h2>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de privacidad para adaptarla a cambios
        legislativos o a nuevas funcionalidades del servicio. Publicaremos la
        versión vigente en esta misma página, indicando la fecha de la última
        actualización. Te recomendamos revisarla periódicamente.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Si tienes cualquier duda sobre esta Política de privacidad o sobre cómo
        tratamos tus datos, contacta con nosotros en{" "}
        <a href={`mailto:${EMPRESA.emailPrivacidad}`}>
          {EMPRESA.emailPrivacidad}
        </a>
        .
      </p>
    </LegalLayout>
  );
}
