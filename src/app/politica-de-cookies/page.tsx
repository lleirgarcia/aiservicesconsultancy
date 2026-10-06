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
      intro={`En ${EMPRESA.webDominio} utilizamos únicamente cookies y almacenamiento técnico necesarios para el funcionamiento del sitio y para prestar los servicios que pides, como recordar tu idioma o limitar el uso del asistente virtual. No utilizamos cookies de publicidad ni de seguimiento. Esta política explica qué son las cookies, cuáles utilizamos y cómo puedes gestionarlas.`}
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
            <td>fto_chat_used</td>
            <td>{EMPRESA.marca}</td>
            <td>
              Cookie técnica. Limita el número de reinicios gratuitos de la
              conversación con el asistente virtual Kromi, para evitar un uso
              abusivo.
            </td>
            <td>7 días</td>
          </tr>
          <tr>
            <td>kroomix-locale <em>(localStorage, no es una cookie)</em></td>
            <td>{EMPRESA.marca}</td>
            <td>Recordar el idioma que has elegido en el sitio.</td>
            <td>Hasta que borres los datos del navegador</td>
          </tr>
          <tr>
            <td>kroomix:scroll-intro-shown <em>(sessionStorage, no es una cookie)</em></td>
            <td>{EMPRESA.marca}</td>
            <td>
              No repetirte el mensaje de bienvenida durante la misma visita.
            </td>
            <td>Sesión (se borra al cerrar el navegador)</td>
          </tr>
          <tr>
            <td>—</td>
            <td>Vercel Inc.</td>
            <td>
              Analítica de visitas (Vercel Analytics). Es una analítica sin
              cookies: no identifica a usuarios individuales ni almacena datos
              personales.
            </td>
            <td>No aplica</td>
          </tr>
        </tbody>
      </table>
      <p>
        No utilizamos cookies de publicidad, de seguimiento entre sitios ni de
        terceros incrustados (como vídeos de YouTube). El contenido concreto de
        esta tabla puede variar a medida que evolucione el Sitio Web.
        Mantendremos la información actualizada en esta misma página.
      </p>

      <h2>4. Gestión de las cookies</h2>
      <p>
        Todas las cookies y el almacenamiento técnico que utilizamos son
        necesarios para el funcionamiento del sitio o para prestar el servicio
        que solicitas (como el asistente virtual), por lo que, conforme al
        artículo 22.2 de la LSSI-CE, no requieren tu consentimiento previo y no
        mostramos un banner de aceptación. Aun así, puedes eliminarlas cuando
        quieras borrando las cookies y los datos de navegación almacenados por
        tu navegador.
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
