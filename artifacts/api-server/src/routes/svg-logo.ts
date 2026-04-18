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

export function generateTextLogoSVGBase64(
  displayName: string,
  size: number | { width ? : number;height ? : number;fontSize ? : number;background ? : string } = 200
): string {
  const sz = typeof size === "number" ? size : 200;
  const initials = escapeXml(getInitials(displayName));
  const bg = typeof size === "object" && size.background ? size.background : getColor(displayName);
  const fontSize = typeof size === "object" && size.fontSize ? size.fontSize : Math.round(sz * 0.4);
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
  <circle cx="${sz / 2}" cy="${sz / 2}" r="${sz / 2}" fill="${bg}"/>
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

export default generateTextLogoSVGBase64;