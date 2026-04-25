import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { EMPRESA } from "@/data/empresa";

export const metadata: Metadata = {
  title: `Política de cookies — ${EMPRESA.marca}`,
  description: `Información sobre las cookies y tecnologías similares utilizadas en ${EMPRESA.webDominio}.`,
};

export default function PoliticaDeCookiesPage() {
  return (
    <LegalLayout
      title="Política de cookies"
      intro={`En ${EMPRESA.webDominio} utilizamos cookies y tecnologías similares para garantizar el correcto funcionamiento del sitio, recordar tus preferencias y, con tu consentimiento, analizar el uso del sitio para mejorarlo. Esta política explica qué son las cookies, qué tipos utilizamos y cómo puedes gestionarlas.`}
    >
      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Una cookie es un pequeño archivo de texto que un sitio web instala en tu
        navegador o dispositivo cuando lo visitas. Las cookies permiten al sitio
        recordar información sobre tu visita —como tu idioma preferido o si has
        iniciado sesión— para que la siguiente visita sea más sencilla y útil.
      </p>

      <h2>2. Tipos de cookies que utilizamos</h2>
      <p>
        Conforme a la guía de la Agencia Española de Protección de Datos sobre
        el uso de cookies, las que utilizamos en este Sitio Web se clasifican
        del siguiente modo:
      </p>

      <h3>2.1. Según la entidad que las gestiona</h3>
      <ul>
        <li>
          <strong>Cookies propias:</strong> son las que se envían a tu equipo
          desde un dominio gestionado por {EMPRESA.razonSocial}.
        </li>
        <li>
          <strong>Cookies de tercero:</strong> se envían desde un dominio gestionado
          por un proveedor externo (por ejemplo, herramientas de analítica o de
          incrustación de vídeo).
        </li>
      </ul>

      <h3>2.2. Según su finalidad</h3>
      <ul>
        <li>
          <strong>Técnicas (necesarias):</strong> imprescindibles para el
          funcionamiento del Sitio Web (sesión, seguridad, balanceo de carga,
          recordar la respuesta del banner de cookies, etc.). No requieren
          consentimiento.
        </li>
        <li>
          <strong>Preferencias:</strong> permiten recordar configuraciones (por
          ejemplo, idioma o si ya has visto el modal de bienvenida).
        </li>
        <li>
          <strong>Analíticas:</strong> nos permiten conocer cómo se usa el Sitio
          Web (páginas más visitadas, tiempo de permanencia, errores) para
          mejorarlo.
        </li>
        <li>
          <strong>De terceros incrustados:</strong> contenido externo embebido
          (por ejemplo, vídeos de YouTube en su modo &quot;sin cookies&quot;).
        </li>
      </ul>

      <h3>2.3. Según su duración</h3>
      <ul>
        <li>
          <strong>De sesión:</strong> se eliminan al cerrar el navegador.
        </li>
        <li>
          <strong>Persistentes:</strong> permanecen almacenadas en tu equipo
          durante el periodo definido por el responsable, que puede ir desde
          unos minutos hasta varios años.
        </li>
      </ul>

      <h2>3. Cookies utilizadas en este sitio</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Titular</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>kroomix:scroll-intro-shown</td>
            <td>{EMPRESA.marca}</td>
            <td>
              Recordar que ya hemos mostrado el modal inicial de bienvenida
              (almacenamiento de sesión).
            </td>
            <td>Sesión</td>
          </tr>
          <tr>
            <td>kroomix:lang</td>
            <td>{EMPRESA.marca}</td>
            <td>Recordar el idioma seleccionado por el usuario.</td>
            <td>1 año</td>
          </tr>
          <tr>
            <td>kroomix:consent</td>
            <td>{EMPRESA.marca}</td>
            <td>
              Almacenar la decisión del usuario sobre el banner de cookies.
            </td>
            <td>6 meses</td>
          </tr>
          <tr>
            <td>_ga, _ga_*</td>
            <td>Google Ireland Limited</td>
            <td>
              Cookies analíticas de Google Analytics 4 que permiten distinguir
              usuarios de forma anonimizada.
            </td>
            <td>Hasta 2 años</td>
          </tr>
          <tr>
            <td>YSC, VISITOR_INFO1_LIVE</td>
            <td>YouTube (Google)</td>
            <td>
              Se instalan únicamente al reproducir un vídeo embebido. Permiten a
              YouTube medir el rendimiento del vídeo.
            </td>
            <td>Sesión / 6 meses</td>
          </tr>
        </tbody>
      </table>
      <p>
        El contenido concreto de esta tabla puede variar a medida que
        evolucione el Sitio Web. Mantendremos la información actualizada en esta
        misma página.
      </p>

      <h2>4. Gestión y revocación del consentimiento</h2>
      <p>
        Al acceder al Sitio Web por primera vez te mostramos un banner que te
        permite aceptar, rechazar o configurar las cookies no esenciales. Puedes
        modificar tu decisión en cualquier momento desde el enlace de
        configuración disponible en el pie de página o eliminando las cookies
        almacenadas en tu navegador.
      </p>
      <p>
        La mayoría de los navegadores permiten también gestionar las
        preferencias de cookies. Aquí tienes los enlaces oficiales:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/es/kb/proteccion-mejorada-rastreo-firefox-escritorio"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/es-es/microsoft-edge"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        Ten en cuenta que si rechazas o eliminas las cookies técnicas necesarias
        algunas funcionalidades del Sitio Web pueden dejar de estar disponibles.
      </p>

      <h2>5. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de cookies en cualquier momento para
        adaptarla a novedades legislativas o a nuevas funcionalidades. La
        versión vigente es siempre la publicada en esta página, junto con la
        fecha de su última actualización.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Para cualquier duda relacionada con el uso de cookies puedes escribirnos
        a{" "}
        <a href={`mailto:${EMPRESA.emailPrivacidad}`}>
          {EMPRESA.emailPrivacidad}
        </a>
        .
      </p>
    </LegalLayout>
  );
}
