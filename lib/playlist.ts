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

    if (ch.drmScheme === "clearkey" && ch.clearKey) {
      out += "#KODIPROP:inputstream=inputstream.adaptive\n";
      out += "#KODIPROP:inputstream.adaptive.manifest_type=mpd\n";
      out += "#KODIPROP:inputstream.adaptive.license_type=org.w3.clearkey\n";
      out += `#KODIPROP:inputstream.adaptive.license_key=${ch.clearKey}\n`;
    }
    
    if (ch.drmScheme === "widevine" && ch.licenseUrl) {
      out += "#KODIPROP:inputstream=inputstream.adaptive\n";
      out += "#KODIPROP:inputstream.adaptive.manifest_type=mpd\n";
      out += "#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha\n";
      out += `#KODIPROP:inputstream.adaptive.license_key=${ch.licenseUrl}\n`;
    }
    
    if (ch.drmScheme === "playready" && ch.licenseUrl) {
      out += "#KODIPROP:inputstream=inputstream.adaptive\n";
      out += "#KODIPROP:inputstream.adaptive.manifest_type=mpd\n";
      out += "#KODIPROP:inputstream.adaptive.license_type=com.microsoft.playready\n";
      out += `#KODIPROP:inputstream.adaptive.license_key=${ch.licenseUrl}\n`;
    }
  }

  return out.trimEnd() + "\n";
}
