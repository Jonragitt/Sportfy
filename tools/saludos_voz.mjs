// Crea shared/voz/saludos.json: las frases que hay que narrar con la voz de Epachuko (Estudio de voz,
// cuaderno de Kaggle) para el saludo de Forty5. Formato del Estudio: {"nombre", "lecciones": [{id, titulo, texto}]}.
// - Con nombre: "<momento>-<nombre>" («¡Buenos días, Jonás!») para los nombres más comunes.
// - Sin nombre: "<momento>-0", "<momento>-1"… para quien tenga un nombre que no está en la lista.
// Uso: node tools/saludos_voz.mjs
import fs from "node:fs";
import { claveNombre, SALUDO_CON_NOMBRE, SALUDO_SIN_NOMBRE } from "../shared/saludo.js";

const NOMBRES = `Jonás Antonio Manuel José Francisco David Juan Javier Daniel Carlos Jesús Alejandro Miguel Rafael Pablo
Pedro Ángel Sergio Fernando Jorge Luis Alberto Álvaro Adrián Diego Raúl Enrique Ramón Vicente Iván Rubén Óscar Andrés
Joaquín Santiago Eduardo Víctor Roberto Jaime Mario Ignacio Alfonso Hugo Marcos Gonzalo Mateo Martín Lucas Leo Nicolás
Samuel Guillermo Héctor Cristian Marc Aitor Unai Iker Rodrigo Tomás Gabriel Emilio Julián Esteban Felipe
María Carmen Ana Isabel Laura Cristina Marta Lucía Paula Sara Elena Raquel Pilar Rocío Andrea Beatriz Patricia Silvia
Julia Irene Alba Claudia Sofía Carla Nuria Natalia Mónica Rosa Teresa Inés Eva Noelia Lorena Sandra Verónica Alicia
Marina Clara Daniela Valeria Martina Emma Lola Carlota Alejandra Noa Aitana Ainhoa Miriam Esther Victoria
Javi Dani Alex Pepe Paco Fran Nacho Manu Rafa Edu Santi Juanma Chema Toni Álex Isa Mari Maite Bea Cris Lu Patri Vero Rocío
Marco Bruno Thiago Liam Pol Biel Izan Erik Gael Enzo Dylan Kevin Jonathan Brian Óliver Arturo Gerardo Ricardo Agustín
Nerea Ainara Lara Vega Olivia Chloe Abril Jimena Mía Candela Ariadna Leire Iratxe Yolanda Susana Ángela Rebeca Gloria Celia Diana Tamara`.split(/\s+/)
  .concat(["José Luis", "Juan Carlos", "José Antonio", "José Manuel", "Juan José", "Juan Antonio", "Miguel Ángel", "Francisco Javier",
    "Juan Manuel", "José María", "Luis Miguel", "María José", "María Jesús", "María Carmen", "Ana Isabel", "María Luisa", "Ana María", "Mari Carmen"]);

const lecciones = [];
const unicos = [...new Map(NOMBRES.map((n) => [claveNombre(n), n])).values()];
for (const [m, frase] of Object.entries(SALUDO_CON_NOMBRE))
  for (const n of unicos) lecciones.push({ id: `${m}-${claveNombre(n)}`, titulo: `${m} · ${n}`, texto: frase.replace("{n}", n) });
for (const [m, frases] of Object.entries(SALUDO_SIN_NOMBRE))
  frases.forEach((t, i) => lecciones.push({ id: `${m}-${i}`, titulo: `${m} · sin nombre ${i + 1}`, texto: t }));
fs.writeFileSync(new URL("../shared/voz/saludos.json", import.meta.url), JSON.stringify({ nombre: "Saludos de Forty5", lecciones }, null, 1));
console.log(lecciones.length, "frases");
