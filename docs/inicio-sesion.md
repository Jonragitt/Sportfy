# Activar el inicio de sesión con Google y Apple

Forty5 ya trae la pantalla de inicio de sesión y el guardado del progreso en la nube
(`shared/cuenta.js`). Para activarlo hacen falta una web propia y un proyecto de Firebase.

## 1. Publicar Forty5 en una web propia (gratis)
Google y Apple solo permiten iniciar sesión desde un dominio autorizado, no desde claude.ai.
- GitHub Pages: en el repositorio, Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/`.
  La web queda en `https://<usuario>.github.io/sportfy/`.
- O Firebase Hosting (mismo proyecto que el paso 2).

## 2. Crear el proyecto de Firebase (gratis)
1. https://console.firebase.google.com → Añadir proyecto (por ejemplo "forty5").
2. Compilación → Authentication → Comenzar → Proveedores: activar **Google**.
3. Authentication → Configuración → Dominios autorizados: añadir el dominio del paso 1.
4. Compilación → Firestore Database → Crear base de datos (modo producción, región europe-west).
5. Firestore → Reglas: pegar el contenido de `firestore.rules` y publicar.
6. Configuración del proyecto → Tus apps → icono web `</>` → registrar la app y copiar el bloque
   `firebaseConfig` (apiKey, authDomain, projectId, appId…). No es secreto.

## 3. Apple (opcional)
Requiere la cuenta Apple Developer (99 USD/año): crear un Services ID con "Sign in with Apple",
añadir el dominio y la URL de retorno que indica Firebase, y activar el proveedor **Apple** en
Authentication con el Services ID, el Team ID y la clave.

## 4. Pegar la configuración
Pegar el bloque del paso 2.6 en `shared/firebase-config.js` (en lugar de `null`). Desde ese momento
los botones dejan de poner "Muy pronto".

## Cómo se guarda
- Cada persona: `usuarios/<uid>/progreso/<clave>` con todo lo que la app guarda bajo `sportfy.*`.
- Al iniciar sesión en un dispositivo nuevo se baja el progreso; si el dispositivo ya tenía otro,
  se pregunta con cuál quedarse. Cada cambio se sube solo en unos segundos.
- Quien ya usaba la app sin cuenta y entra con Google por primera vez sube su progreso tal cual.
