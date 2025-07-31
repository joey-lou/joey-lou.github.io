const COLOR_PALETTES = {
  light: {
    success: '#2ecc71',
    successDark: '#27ae60',
    danger: '#e74c3c',
    dangerDark: '#c0392b',
    warning: '#f39c12',
    warningDark: '#e67e22',
    warningDarkest: '#d35400',
    info: '#3498db',
    secondary: '#9b59b6',
    secondaryDark: '#8e44ad',
    gridColor: 'rgba(0, 0, 0, 0.1)',
    textColor: '#333333',
  },
  dark: {
    success: '#10d65b',
    successDark: '#0ea349',
    danger: '#ff6b6b',
    dangerDark: '#e74c3c',
    warning: '#ffa726',
    warningDark: '#fb8c00',
    warningDarkest: '#f57c00',
    info: '#42a5f5',
    secondary: '#ab47bc',
    secondaryDark: '#8e24aa',
    gridColor: 'rgba(255, 255, 255, 0.2)',
    textColor: '#ffffff',
  },
};

function hexToRgba(hex, alpha = 0.1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCurrentColors() {
  const isDarkTheme = document.body.getAttribute('data-bs-theme') === 'dark';
  const palette = COLOR_PALETTES[isDarkTheme ? 'dark' : 'light'];

  return {
    ...palette,
    successAlpha: hexToRgba(palette.success),
    dangerAlpha: hexToRgba(palette.danger),
    warningAlpha: hexToRgba(palette.warning),
    infoAlpha: hexToRgba(palette.info),
  };
}

export { COLOR_PALETTES, hexToRgba, getCurrentColors };
