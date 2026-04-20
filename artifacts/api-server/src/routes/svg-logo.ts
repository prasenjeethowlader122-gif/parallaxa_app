import { createAvatar } from "@dicebear/core";
import { funEmoji } from "@dicebear/collection";

export function generateTextLogoSVGBase64(
  displayName: string,
  _size:
    | number
    | {
        width?: number;
        height?: number;
        fontSize?: number;
        background?: string;
      } = 200
): string {
  const avatar = createAvatar(funEmoji, {
    seed: displayName,
    size: 200,
  });

  const svg = avatar.toString();

  // React Native compatible base64 data URI
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg).toString("base64")          // Node.js / API server
      : btoa(unescape(encodeURIComponent(svg)));     // Browser / RN JS runtime

  return `data:image/svg+xml;base64,${base64}`;
}

export default generateTextLogoSVGBase64;