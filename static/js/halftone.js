(() => {
  const TILE = 600;
  const SPACING = 10;
  const DOT_MIN = 0.8;
  const DOT_MAX = 4.8;
  const SEED = 42;

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(a, b, t) {
    return a + t * (b - a);
  }

  function makePermutation(seed) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
  }

  function grad2d(hash, x, y) {
    const h = hash & 3;
    return (h < 2 ? x : -x) + (h === 0 || h === 3 ? y : -y);
  }

  function perlin2d(perm, x, y) {
    const xi = Math.floor(x) & 255,
      yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x),
      yf = y - Math.floor(y);
    const u = fade(xf),
      v = fade(yf);
    const aa = perm[perm[xi] + yi],
      ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi],
      bb = perm[perm[xi + 1] + yi + 1];
    return lerp(
      lerp(grad2d(aa, xf, yf), grad2d(ba, xf - 1, yf), u),
      lerp(grad2d(ab, xf, yf - 1), grad2d(bb, xf - 1, yf - 1), u),
      v
    );
  }

  function fbm(perm, x, y, octaves) {
    let val = 0,
      amp = 0.5,
      freq = 1;
    for (let i = 0; i < octaves; i++) {
      val += amp * perlin2d(perm, x * freq, y * freq);
      amp *= 0.5;
      freq *= 2;
    }
    return val;
  }

  const perm = makePermutation(SEED);

  function renderTile(dotColor) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext('2d');
    for (let y = SPACING / 2; y < TILE; y += SPACING) {
      for (let x = SPACING / 2; x < TILE; x += SPACING) {
        const n = fbm(perm, x * 0.012, y * 0.012, 3);
        const r = DOT_MIN + ((n + 1) / 2) * (DOT_MAX - DOT_MIN);
        const opacity = 0.25 + ((n + 1) / 2) * 0.45;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.globalAlpha = opacity;
        ctx.fill();
      }
    }
    return canvas.toDataURL();
  }

  const TILE_COLORS = { light: '#000', dark: '#fff' };
  const tileCache = new Map();

  let styleEl = document.createElement('style');
  styleEl.id = 'halftone-tile';
  document.head.appendChild(styleEl);

  function themeKey() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }

  function getTile(key) {
    if (!tileCache.has(key)) {
      tileCache.set(key, renderTile(TILE_COLORS[key]));
    }
    return tileCache.get(key);
  }

  function apply() {
    const url = getTile(themeKey());
    styleEl.textContent = `body::after { background-image: url("${url}"); }`;
  }

  apply();

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-bs-theme') {
        apply();
        break;
      }
    }
  }).observe(document.documentElement, { attributes: true });
})();
