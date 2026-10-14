// Acentos oscurecidos para texto sobre fondos claros (contraste ≥ 4.3:1 sobre blanco).
const DARKER_ACCENTS = {
  '#FF2E63': '#D4145A',
  '#FF7A9C': '#DB2777',
  '#00E676': '#00875A',
  '#00B0FF': '#0284C7',
  '#57D3FF': '#0284C7',
  '#FFC400': '#B45309',
  '#FF6B00': '#C2410C',
  '#7C4DFF': '#6D28D9',
};

export const accentText = (hex, isLight) => (isLight ? DARKER_ACCENTS[hex] || hex : hex);
