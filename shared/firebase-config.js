// Configuración web de Firebase para iniciar sesión con Google y Apple y guardar el progreso.
// Se copia de la consola de Firebase: Configuración del proyecto > Tus apps > App web > Configuración.
// Estos datos no son secretos: identifican el proyecto, y la seguridad la ponen las reglas de
// Firestore (firestore.rules). Mientras valga null, la app funciona sin cuenta, solo en el dispositivo.
export const FIREBASE_CONFIG = null;
/* Ejemplo:
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "forty5-app.firebaseapp.com",
  projectId: "forty5-app",
  appId: "...",
};
*/
