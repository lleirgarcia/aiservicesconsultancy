@AGENTS.md

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the implementation plan:
`specs/002-blog-articles/plan.md`
<!-- SPECKIT END -->

## Dónde corren los tests

En GitHub, no en esta máquina. El workflow `.github/workflows/pruebas.yml`
ejecuta `npm test` en cada PR y en cada push a `main`,
y el cierre de un encargo de theObserver lee ese veredicto con `gh pr checks`
en vez de relanzar la suite en el VPS (norma 8 de
`theObserver/mapa/NORMAS.md`; el porqué, en la 5). Para lanzarlas a mano:
`npm test`. Si cambias cómo se ejecutan las pruebas, cámbialo en
el workflow y en `pruebas:` de `theObserver/mapa/proyectos/aiservicesconsultancy.md` a la
vez: el auditor no puede comprobar que coincidan.
