export class ThemeColors {
  constructor() {
    this.colorCache = new Map();
    this.currentTheme = null;
  }

  getCurrentTheme() {
    return document.body.getAttribute('data-bs-theme') || 'light';
  }

  refresh() {
    this.colorCache.clear();
    this.currentTheme = null;
  }

  getColorFromCSS(variable) {
    const theme = this.getCurrentTheme();

    if (this.currentTheme !== theme) {
      this.colorCache.clear();
      this.currentTheme = theme;
    }

    const cacheKey = `${variable}-${theme}`;
    if (this.colorCache.has(cacheKey)) {
      return this.colorCache.get(cacheKey);
    }

    const color = getComputedStyle(document.body).getPropertyValue(variable).trim();

    this.colorCache.set(cacheKey, color);
    return color;
  }

  getWallColor(wallType) {
    switch (wallType) {
      case -1:
        return this.getExitColor();
      case 1:
        return this.getColorFromCSS('--maze-wall-1');
      case 2:
        return this.getColorFromCSS('--maze-wall-2');
      case 3:
        return this.getColorFromCSS('--maze-wall-3');
      case 4:
        return this.getColorFromCSS('--maze-wall-4');
      case 5:
        return this.getColorFromCSS('--maze-border');
      default:
        return this.getColorFromCSS('--cell-dead-color');
    }
  }

  getDarkenedWallColor(wallType) {
    const color = this.getWallColor(wallType);
    return this.darkenColor(color, 0.7);
  }

  getStartColor() {
    return this.getColorFromCSS('--maze-start');
  }

  getExitColor() {
    return this.getColorFromCSS('--maze-exit');
  }

  getBorderColor() {
    return this.getColorFromCSS('--maze-border');
  }

  getEnvironmentColors() {
    return {
      ceiling: this.getColorFromCSS('--maze-ceiling'),
      floor: this.getColorFromCSS('--maze-floor'),
    };
  }

  darkenColor(color, factor = 0.7) {
    if (color === '#000000') return color;
    if (!color.startsWith('#')) return color;

    const r = Math.floor(parseInt(color.substr(1, 2), 16) * factor);
    const g = Math.floor(parseInt(color.substr(3, 2), 16) * factor);
    const b = Math.floor(parseInt(color.substr(5, 2), 16) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
