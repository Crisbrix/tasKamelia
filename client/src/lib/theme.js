// Acentos oscurecidos para texto sobre fondos claros (contraste ≥ 4.3:1 sobre blanco).
const DARKER_ACCENTS = {
  '#F43F5E': '#BE123C',
  '#FB7185': '#DB2777',
  '#10B981': '#047857',
  '#3B82F6': '#1D4ED8',
  '#94A3B8': '#475569',
  '#D97706': '#B45309',
  '#60A5FA': '#0284C7',
  '#F59E0B': '#B45309',
  '#F97316': '#C2410C',
  '#8B5CF6': '#6D28D9',
};

export const accentText = (hex, isLight) => (isLight ? DARKER_ACCENTS[hex] || hex : hex);
