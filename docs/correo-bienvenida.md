# Correo de bienvenida de Forty5

Cuando alguien inicia sesión con Google y escribe su nombre, la app (`shared/cuenta.js`) llama a la
función de Netlify `netlify/functions/bienvenida.mjs`, que comprueba la sesión y manda el correo con
Brevo a la dirección de esa cuenta. Se manda una sola vez: en Firestore, `usuarios/<uid>` guarda
`nombre`, `correo` y `bienvenida` (fecha de envío).

## Puesta en marcha (una vez)

1. Crea una cuenta gratis en https://www.brevo.com (300 correos al día).
2. En Brevo → *Senders, domains & dedicated IPs* → *Senders*, añade el correo que enviará
   (por ejemplo tu Gmail) y confírmalo desde el correo que te llega.
3. En Brevo → *SMTP & API* → *API keys*, crea una clave.
4. En Netlify → el sitio forty5 → *Site configuration* → *Environment variables*, añade:
   - `BREVO_API_KEY` = la clave del paso 3
   - `REMITENTE` = el correo confirmado del paso 2
5. Vuelve a publicar (o espera al siguiente despliegue).

Si falta la configuración, la función responde 503 y la app lo vuelve a intentar en otra visita.
Con un dominio propio verificado en Brevo los correos llegan mejor (menos a spam) que con un Gmail.

## Cambiar el contenido

- Texto y diseño: `netlify/functions/plantilla-bienvenida.mjs`.
- Imágenes (móviles iPhone con la app): `shared/correo/*.jpg`.
