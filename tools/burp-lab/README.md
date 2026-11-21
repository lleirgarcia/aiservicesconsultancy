# Burp Playground

Laboratorio deliberadamente vulnerable, separado de la aplicación Next.js. Solo escucha en `127.0.0.1:8090`; no desplegar ni exponer con túneles. Todos los registros son ficticios y se almacenan en memoria. Requiere Python 3, sin dependencias adicionales.

## Arrancar

Desde la raíz del proyecto:

```sh
python3 tools/burp-lab/server.py
```

Abrir http://127.0.0.1:8090. Detener con Ctrl+C. Si el puerto está ocupado, detener la instancia anterior antes de volver a arrancar. Reiniciar el proceso restaura todos los datos y tokens; «Reiniciar datos» restaura el correo y vacía los comentarios.

## Usarlo en Burp Community

1. Abrir Burp Suite desde Aplicaciones. Completar personalmente los avisos de licencia del primer arranque, si aparecen.
2. Temporary project → Use Burp defaults → Start Burp.
3. Proxy → Intercept → Open browser. Abrir http://127.0.0.1:8090 en ese navegador, que ya lleva el proxy configurado.
4. Target → Site map → botón derecho sobre el origen → Add to scope.
5. Dejar Intercept off para navegar. Activarlo cuando se quiera editar una petición; pulsar Forward para continuar.
6. En Proxy → HTTP history, enviar una petición a Repeater. Cambiar parámetros y pulsar Send.
7. Seguir las pistas desplegables de cada tarjeta.

## Ejercicios

| Ruta | Práctica | Herramienta |
|---|---|---|
| GET /search?q=Hola | XSS reflejado real | Proxy, Repeater |
| GET /products?q=Teclado | SQL injection real, SQLite en memoria | Repeater, Intruder |
| POST /login | Enumeración; demo / burp123 | Intruder, Comparer |
| GET /api/profile?id=1 | IDOR, cambiar a 2 | Repeater, Comparer |
| POST /api/checkout | Manipular precio y cantidad; acepta form y JSON | Proxy, Repeater |
| POST y GET /comments | XSS almacenado en memoria | Repeater, navegador |
| GET /redirect?next=/admin-demo | Redirección abierta | Repeater |
| POST /api/email | Falta token CSRF y validación Origin; requiere cookie del login | Repeater |
| GET /download?file=guide.txt | Traversal virtual: ../private/demo.txt | Decoder, Repeater |
| GET /token | Token consecutivo en JSON y Set-Cookie | Sequencer |
| GET /robots.txt | Descubrimiento de /admin-demo | Target, Proxy |

La cookie del login usa SameSite=Lax: la falta de token CSRF no implica que funcione cualquier ataque entre sitios. El traversal opera sobre un diccionario ficticio y nunca lee el disco. La SQL injection sí se ejecuta contra una base real, exclusivamente en memoria.

## Pasar otras URLs

El formulario «Tu URL, dentro de Burp» genera instrucciones, no invoca Burp ni escanea. Para probar una URL propia o autorizada, abrirla en el navegador de Burp, añadir su origen al scope y navegar. Seleccionar peticiones del historial y enviarlas a Repeater o Intruder.

## Qué depende de la edición y qué falta

Community permite Proxy, Target, Repeater, Intruder con limitaciones, Decoder, Comparer y Sequencer. El escáner automático requiere Professional (o el producto DAST). Con Professional: New scan → URL del laboratorio → configurar alcance y opciones → iniciar. Collaborator/OAST también requiere funcionalidad Professional y conectividad apropiada.

Este laboratorio HTTP no implementa HTTPS, HTTP/2, WebSockets, SSRF/OAST, XXE, deserialización, condiciones de carrera ni todos los escenarios de extensiones. Para esos casos, usar los laboratorios específicos de Web Security Academy. No hay una página que por sí sola habilite todas las funciones de todas las ediciones.

- Herramientas: https://portswigger.net/burp/documentation/desktop/tools
- Primer escaneo: https://portswigger.net/burp/documentation/desktop/getting-started/running-your-first-scan
- Laboratorios adicionales: https://portswigger.net/web-security/all-labs

## Comprobaciones

Con el servidor en marcha: `python3 tools/burp-lab/check.py`.
