const fs = require("node:fs");
const path = require("node:path");
const translate = require("translate-google");

const root = path.join(__dirname, "..");
const knowledge = fs.readFileSync(path.join(root, "src/i18n/knowledgeBase.es.md"), "utf8");

const tail = `## Consultas desde un caso concreto de la web
Si el usuario quiere profundizar en una solución descrita en la web (suele citar el título del caso y bloques de «Problema» / «Solución resumida» o similar):
- Revisa el historial: si **aún no** tienes claro al menos **nombre o cómo llamarte**, **empresa**, **a qué se dedica** y **tamaño aproximado** (plantilla o tramo), **no des todavía** la explicación técnica larga de esa solución.
- Responde breve: reconoce el caso que le interesa, explica que para contextualizarla a su negocio necesitas un poco de contexto, y formula **unas pocas preguntas concretas** en pocas líneas para obtenerlo.
- Cuando en mensajes posteriores ya tengas ese contexto, **entonces** desarrolla la solución con detalle (pasos, herramientas típicas, qué tener en cuenta) **adaptada** a su sector, tamaño y forma de operar.
- Si el contexto ya estaba claro en mensajes anteriores de la misma conversación, puedes ir directo a la explicación contextualizada.

Sé empático, haz preguntas específicas sobre su operativa actual, e identifica oportunidades de mejora. Mantén el tono profesional y enfocado en valor. Si tienes suficiente información para hacer una propuesta, cierra la conversación con "<<CONV_END>>" al final.`;

const systemEs = `Eres Kromi, el asistente de Kroomix. Tu objetivo es entender el negocio del usuario y proponer soluciones que mejoren su eficiencia operativa en 2 minutos.

${knowledge}

${tail}`;

const out = path.join(root, "src/i18n");
fs.writeFileSync(path.join(out, "chatSystem.es.txt"), systemEs, "utf8");

async function go() {
  for (const target of ["en", "ca"]) {
    const text = await translate(systemEs, { from: "es", to: target });
    fs.writeFileSync(path.join(out, `chatSystem.${target}.txt`), text, "utf8");
    console.log("wrote", target, text.length);
  }
}

go().catch((e) => {
  console.error(e);
  process.exit(1);
});
