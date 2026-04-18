const SVG = require('@svgdotjs/svg.js').SVG;
const fs = require('fs'); // Optional

function generateTextLogoSVGBase64(text, options = {}) {
  const {
    width = 800,
    height = 300,
    fontSize = 100,
    fontFamily = 'Arial, sans-serif',
    fillColor = '#ffffff',
    strokeColor = '#333333',
    strokeWidth = 3,
    background = '#4a90e2',
    shadow = true // SVG drop-shadow filter
  } = options;

  const draw = SVG().size(width, height);

  // Background
  draw.rect(width, height).fill(background);

  // Drop shadow (vector equivalent)
  if (shadow) {
    const filter = draw.filter(1.2, 1.2);
    filter.shadow(0, 5, 8, 0.5);
    draw.text(text).font({ size: fontSize, family: fontFamily, anchor: 'middle', fill: fillColor })
      .stroke({ width: strokeWidth, color: strokeColor })
      .filterWith(filter)
      .x(width / 2).cy(height / 2);
  } else {
    draw.text(text).font({ size: fontSize, family: fontFamily, anchor: 'middle', fill: fillColor })
      .stroke({ width: strokeWidth, color: strokeColor })
      .x(width / 2).cy(height / 2);
  }

  // Base64 SVG data URL
  const svgString = draw.svg();
  const base64DataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgString).toString('base64');

  return base64DataUrl;
}

// Usage
export default generateTextLogoSVGBase64

//console.log(logoSVGBase64); // Store in DB: INSERT INTO logos (svg_data) VALUES (...)