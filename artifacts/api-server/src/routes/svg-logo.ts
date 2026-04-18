const PALETTE = [
  "#5C6BC0", "#42A5F5", "#26A69A", "#66BB6A",
  "#FFA726", "#EF5350", "#AB47BC", "#EC407A",
  "#8D6E63", "#78909C",
];

function getColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateAvatarSVGBase64(
  displayName: string,
  size = 200
): string {
  const initials = escapeXml(getInitials(displayName));
  const bg = getColor(displayName);
  const fontSize = Math.round(size * 0.4);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bg}"/>
  <text
    x="50%" y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-size="${fontSize}"
    font-family="system-ui, -apple-system, Arial, sans-serif"
    font-weight="600"
    fill="#ffffff"
    letter-spacing="1"
  >${initials}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default generateAvatarSVGBase64;