/* Acceso a las demos (/demos y /agentes-app): usuario y contraseña en DEMO_USER / DEMO_PASSWORD.
   Sesión en una cookie HttpOnly firmada con HMAC (la propia contraseña es la clave: cambiarla cierra todas las sesiones).
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

export function credencialesValidas(usuario: string, contrasena: string) {
  // Tolerante con lo que se cuela al copiar/pegar o con el teclado del móvil: espacios alrededor y mayúsculas en el usuario.
  const u = usuario.trim().toLowerCase() === (process.env.DEMO_USER ?? "").trim().toLowerCase();
  const c = igual(contrasena.trim(), (process.env.DEMO_PASSWORD ?? "").trim());
  return u && c;
}
