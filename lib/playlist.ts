import type { Channel } from "./types";

function esc(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').trim();
}

function safe(value: string) {
  return value?.trim?.() ?? "";
}

// Browser-safe encoding
export function encodePlaylistData(channels: Channel[]) {
  return encodeURIComponent(JSON.stringify(channels));
}

// Browser-safe decoding
export function decodePlaylistData(data: string): Channel[] {
  try {
    const parsed = JSON.parse(decodeURIComponent(data));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function generateM3U(channels: Channel[]) {
  let out = "#EXTM3U\n\n";

  for (const ch of channels) {
    const attrs: string[] = [];

    if (safe(ch.tvgId))
      attrs.push(`tvg-id="${esc(ch.tvgId)}"`);

    if (safe(ch.name))
      attrs.push(`tvg-name="${esc(ch.name)}"`);

    if (safe(ch.logo))
      attrs.push(`tvg-logo="${esc(ch.logo)}"`);

    if (safe(ch.groupTitle))
      attrs.push(`group-title="${esc(ch.groupTitle)}"`);

    out += `#EXTINF:-1 ${attrs.join(" ")},${safe(ch.name) || "Untitled Channel"}\n`;

    if (ch.type === "dash") {
      out += "#KODIPROP:inputstream.adaptive.manifest_type=mpd\n";
    }

    if (safe(ch.origin)) {
      out += `#EXTVLCOPT:http-origin=${safe(ch.origin)}\n`;
    }

    if (safe(ch.referer)) {
      out += `#EXTVLCOPT:http-referrer=${safe(ch.referer)}\n`;
    }

    if (safe(ch.cookie)) {
      out += `#EXTVLCOPT:http-cookie=${safe(ch.cookie)}\n`;
    }

    if (safe(ch.userAgent)) {
      out += `#EXTVLCOPT:http-user-agent=${safe(ch.userAgent)}\n`;
    }

    if((ch as any).drmScheme && (ch as any).drmScheme!=="none") out += `#DRM:${(ch as any).drmScheme}|${(ch as any).licenseUrl||""}|${(ch as any).clearKey||""}\n`;
    out += `${safe(ch.url)}\n\n`;
  }

  return out.trimEnd() + "\n";
}
