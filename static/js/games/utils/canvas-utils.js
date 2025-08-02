/**
 * Canvas Utilities - Helper functions for high-DPI canvas setup
 */

/**
 * Sets up a canvas for high-DPI displays by accounting for devicePixelRatio
 * This prevents blurry text and graphics on Retina and other high-DPI screens
 * Preserves CSS-based responsive sizing by not overriding style dimensions
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to setup
 * @returns {CanvasRenderingContext2D} The 2D context, scaled appropriately
 */
export function setupHighDPICanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Get the display size as rendered by CSS (don't override CSS sizing)
  const rect = canvas.getBoundingClientRect();
  const displayWidth = rect.width;
  const displayHeight = rect.height;

  // Set the canvas resolution to account for device pixel ratio
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // DO NOT set style.width/height - let CSS control the display size
  // This preserves responsive sizing (width: 100%, height: 100%)

  // Scale the drawing context so everything draws at the correct size
  ctx.scale(dpr, dpr);

  return ctx;
}

/**
 * Resizes a high-DPI canvas, maintaining proper scaling
 * Call this when the canvas container is resized
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to resize
 * @param {CanvasRenderingContext2D} ctx - The canvas context (will be re-scaled)
 * @returns {Object} The new logical dimensions {width, height}
 */
export function resizeHighDPICanvas(canvas, ctx) {
  // Re-setup the canvas with new dimensions and scaling
  setupHighDPICanvas(canvas);

  // Return the logical (display) dimensions for game calculations
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}
