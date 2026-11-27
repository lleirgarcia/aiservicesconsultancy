/* Acceso a las demos (/demos y /agentes-app). Los usuarios y contraseñas viven en el backend de agentes (ver api/demos-login);
   aquí solo hay una cookie HttpOnly firmada con HMAC, con DEMO_PASSWORD como clave de firma (cambiarla cierra todas las sesiones).
   Sin DEMO_PASSWORD (local) las demos quedan abiertas.
   Usa solo Web Crypto: sirve en el proxy y en las rutas. */

export const COOKIE_DEMO = "kroomix_demo";
export const DURACION_SESION_S = 60 * 60 * 24 * 7;

const enc = new TextEncoder();

export const accesoActivo = () => Boolean(process.env.DEMO_PASSWORD);

function igual(a: string, b: string) {
  // Comparación en tiempo constante.
  const n = Math.max(a.length, b.length);
  let d = a.length ^ b.length;
  for (let i = 0; i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

async function firmar(texto: string): Promise<string> {
  const clave = await crypto.subtle.importKey("raw", enc.encode(process.env.DEMO_PASSWORD ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", clave, enc.encode(texto));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function crearSesion(): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + DURACION_SESION_S);
  return `${exp}.${await firmar(exp)}`;
}

export async function sesionValida(valor: string | undefined): Promise<boolean> {
  if (!valor) return false;
  const [exp, firma] = valor.split(".");
  if (!exp || !firma || Number(exp) < Date.now() / 1000) return false;
  return igual(firma, await firmar(exp));
}
