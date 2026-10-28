// Theme accents (copy only, theme-change batch).
// One accent drives the shell (buttons, active nav, frame tint) and the
// mono chart palettes, so changing the theme actually changes the whole
// app instead of only one button. Dark palettes are lighter, because the
// light palettes are unreadable on the dark navy background.
export const ACCENTS = [
  {
    id: 'navy',
    name: 'Marine',
    light: '#16294D',
    dark: '#8AA0BC',
    frame: '#EDF1F5',
    shades: ['#16294D', '#2E4A73', '#5B7AA0', '#8AA0BC', '#C2D0E0'],
    darkShades: ['#C2D0E0', '#8AA0BC', '#7FA3CC', '#5B7AA0', '#3A5A86'],
  },
  {
    id: 'teal',
    name: 'Sarcelle',
    light: '#0F766E',
    dark: '#2DD4BF',
    frame: '#E7F2EF',
    shades: ['#0F766E', '#178A7E', '#2AA99B', '#5CC2B4', '#99D9CF'],
    darkShades: ['#99D9CF', '#5CC2B4', '#2DD4BF', '#2AA99B', '#178A7E'],
  },
  {
    id: 'gold',
    name: 'Or',
    light: '#B45309',
    dark: '#FBBF24',
    frame: '#F5EDDC',
    shades: ['#B45309', '#C27A1A', '#D99A2B', '#E8B85C', '#F2D18F'],
    darkShades: ['#F2D18F', '#E8B85C', '#FBBF24', '#D99A2B', '#C27A1A'],
  },
  {
    id: 'green',
    name: 'Vert',
    light: '#15803D',
    dark: '#4ADE80',
    frame: '#E8F3E8',
    shades: ['#15803D', '#1E9A4B', '#35B25F', '#6FC98D', '#A8DCBB'],
    darkShades: ['#A8DCBB', '#6FC98D', '#4ADE80', '#35B25F', '#1E9A4B'],
  },
];

export const getAccent = (id) => ACCENTS.find((a) => a.id === id) || ACCENTS[0];

export const getChartPalette = (accentId, theme) =>
  theme === 'dark' ? getAccent(accentId).darkShades : getAccent(accentId).shades;
