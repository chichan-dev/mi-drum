const tintColorLight = '#ff2a3b';
const tintColorDark = '#ff2a3b';

// Paleta "chxchx-dev": rojo neón sobre negro cálido, sin tintes azulados.
// Los colores de acento funcionales (deck A/B, botones play/cue, etc.) no
// forman parte de esta paleta y viven en cada componente.
export const Palette = {
  bgBase: '#07080a',
  bgPanel: '#120d0d',
  bgPanelAlt: '#170f0f',
  bgSunken: '#0c0908',
  border: '#33181c',
  borderStrong: '#4a2126',
  textPrimary: '#e3e5ec',
  textMuted: '#6b4f4f',
  accent: tintColorDark,
};

export default {
  light: {
    text: Palette.textPrimary,
    background: Palette.bgBase,
    tint: tintColorLight,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Palette.textPrimary,
    background: Palette.bgBase,
    tint: tintColorDark,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: tintColorDark,
  },
};
