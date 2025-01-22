export class Body {
  constructor(x, y, mass, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.mass = mass;
    this.baseColor = color;
    this.radius = Math.sqrt(mass) * 0.3; // Slightly smaller base size
    this.trail = [];
    this.maxTrailLength = 50;
    this.isDragging = false;
  }
  updateMass(mass) {
    this.mass = mass;
    this.radius = Math.sqrt(mass) * 0.3;
  }

  updateTrailLength(length) {
    this.maxTrailLength = length;
    if (length === 0) {
      this.trail = [];
    } else if (this.trail.length > length) {
      this.trail = this.trail.slice(-length);
    }
  }

  // Get theme-adjusted color
  getColor() {
    const theme = localStorage.getItem('theme') || 'light';
    const color = this.baseColor.toLowerCase();

    // Convert color names to hex
    const colorMap = {
      '#ff0000': { light: '#ff9999', dark: '#cc0000' }, // red
      '#ffff00': { light: '#ffff99', dark: '#cccc00' }, // yellow
      '#0000ff': { light: '#9999ff', dark: '#0000cc' }, // blue
    };

    if (colorMap[color]) {
      return theme === 'light' ? colorMap[color].dark : colorMap[color].light;
    }
    return this.baseColor;
  }

  draw(ctx) {
    const currentColor = this.getColor();

    // Draw trail with gradient and variable width
    if (this.trail.length > 1) {
      // Draw trail segments from oldest to newest
      for (let i = 0; i < this.trail.length - 1; i++) {
        const point = this.trail[i];
        const nextPoint = this.trail[i + 1];

        // Calculate width based on position in trail (thicker near the body)
        const progress = i / (this.trail.length - 1);
        const width = this.radius * (0.2 + progress * 1.0);

        // Calculate alpha based on position
        const alpha = 0.1 + (1 - progress) * 0.3;

        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = `${currentColor}${Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, '0')}`;

        // Draw line segment with rounded ends
        ctx.lineCap = 'round';
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
      }
    }

    // Draw glow effect
    const glow = ctx.createRadialGradient(
      this.x,
      this.y,
      this.radius * 0.5,
      this.x,
      this.y,
      this.radius * 2
    );
    glow.addColorStop(0, currentColor + 'ff');
    glow.addColorStop(0.5, currentColor + '40');
    glow.addColorStop(1, currentColor + '00');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Draw core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = currentColor;
    ctx.fill();
  }

  updateTrail() {
    this.trail.push({
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
    });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  clearTrail() {
    this.trail = [];
  }

  containsPoint(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return dx * dx + dy * dy <= this.radius * 2 * (this.radius * 2); // Increased hit area
  }
}
