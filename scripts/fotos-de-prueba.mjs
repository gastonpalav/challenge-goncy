// Genera fotos de prueba dibujadas, para trabajar hasta que lleguen las fotos reales.
// Son figuras simples con el cartel "foto de prueba": no pretenden pasar por piezas de verdad.
// Uso: node scripts/fotos-de-prueba.mjs
import sharp from 'sharp';
import fs from 'node:fs/promises';

const W = 960;
const H = 1200;

const shapes = {
  taza: (c) => `<rect x="300" y="470" width="300" height="330" rx="34" fill="${c}"/>
    <path d="M600 540 q130 10 120 110 q-10 90 -120 90" fill="none" stroke="${c}" stroke-width="38"/>`,
  cuenco: (c) => `<path d="M220 560 h520 q-10 250 -260 250 q-250 0 -260 -250z" fill="${c}"/>`,
  maceta: (c) => `<path d="M270 470 h420 l-60 360 h-300z" fill="${c}"/><rect x="250" y="430" width="460" height="70" rx="12" fill="${c}"/>`,
  jarra: (c) => `<path d="M340 380 h260 l40 440 h-340z" fill="${c}"/>
    <path d="M610 470 q150 20 130 150 q-15 90 -110 100" fill="none" stroke="${c}" stroke-width="34"/>
    <path d="M340 380 l-50 -40 l70 10z" fill="${c}"/>`,
  plato: (c) => `<ellipse cx="480" cy="660" rx="300" ry="90" fill="${c}"/><ellipse cx="480" cy="645" rx="210" ry="52" fill="#00000022"/>`,
  florero: (c) => `<path d="M420 330 h120 v120 q150 90 110 280 q-20 100 -170 100 q-150 0 -170 -100 q-40 -190 110 -280z" fill="${c}"/>`,
  sahumerio: (c) => `<ellipse cx="480" cy="760" rx="250" ry="60" fill="${c}"/><rect x="474" y="420" width="12" height="330" fill="#5b4636"/>`,
  mate: (c) => `<path d="M360 500 q120 -50 240 0 q60 170 -20 300 q-100 40 -200 0 q-80 -130 -20 -300z" fill="${c}"/>
    <rect x="500" y="330" width="16" height="220" rx="8" fill="#9a9a9a" transform="rotate(14 508 440)"/>`,
  azucarera: (c) => `<path d="M300 560 h360 q20 260 -180 260 q-200 0 -180 -260z" fill="${c}"/>
    <path d="M290 560 q190 -130 380 0z" fill="${c}"/><circle cx="480" cy="462" r="30" fill="${c}"/>`,
};

const photos = [
  ['taza-marron', 'taza', '#7a4a2b', '#e6dccb'],
  ['cuenco', 'cuenco', '#e9e2d0', '#cbb99c'],
  ['maceta', 'maceta', '#b5633c', '#e3d9c6'],
  ['maceta-nueva', 'maceta', '#b5633c', '#efe9dc'],
  ['jarra', 'jarra', '#5c7f6b', '#e6dccb'],
  ['plato-hondo', 'plato', '#d9b44a', '#d8ccb6'],
  ['florero', 'florero', '#7a5c86', '#e3d9c6'],
  ['tazon', 'cuenco', '#3d4a5c', '#e6dccb'],
  ['portasahumerio', 'sahumerio', '#8c8c80', '#ded4c0'],
  ['azucarera-azul', 'azucarera', '#3f6a8a', '#e6dccb'],
  ['mate-verde', 'mate', '#6f8f5b', '#e3d9c6'],
  ['yerbera', 'maceta', '#c98a5a', '#e9e0cf'],
  ['plato-playo', 'plato', '#a8452f', '#dfd5c2'],
  ['jarrito', 'taza', '#c9c2ae', '#d3c5ab'],
];

await fs.mkdir('public/muestra', { recursive: true });
for (const [id, shape, color, background] of photos) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${background}"/>
    <ellipse cx="480" cy="850" rx="330" ry="34" fill="#00000018"/>
    ${shapes[shape](color)}
    <text x="480" y="1120" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#00000066">foto de prueba</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(`public/muestra/${id}.webp`);
}
console.log(`${photos.length} fotos de prueba en public/muestra/`);
