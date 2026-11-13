// Configuración web de Firebase para iniciar sesión con Google y Apple y guardar el progreso.
// Se copia de la consola de Firebase: Configuración del proyecto > Tus apps > App web > Configuración.
// Estos datos no son secretos: identifican el proyecto, y la seguridad la ponen las reglas de
// Firestore (firestore.rules). Mientras valga null, la app funciona sin cuenta, solo en el dispositivo.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBCxNePNbTRfKB-zLpK1zKAXmX-7dsdzys",
  authDomain: "forty5-de02b.firebaseapp.com",
  projectId: "forty5-de02b",
  storageBucket: "forty5-de02b.firebasestorage.app",
  messagingSenderId: "44599022374",
  appId: "1:44599022374:web:16683ec8afe15fcd2027e7",
  measurementId: "G-YYK391SPTE",
};
// Apple necesita la cuenta Apple Developer y el proveedor Apple activado en Firebase.
export const APPLE_ACTIVO = false;
/* Ejemplo:
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "forty5-app.firebaseapp.com",
  projectId: "forty5-app",
  appId: "...",
};
*/
