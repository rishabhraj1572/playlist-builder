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

    if (safe(ch.origin))
      out += `#EXTVLCOPT:http-origin=${safe(ch.origin)}\n`;

    if (safe(ch.referer))
      out += `#EXTVLCOPT:http-referrer=${safe(ch.referer)}\n`;

    if (safe(ch.cookie))
      out += `#EXTVLCOPT:http-cookie=${safe(ch.cookie)}\n`;

    if (safe(ch.userAgent))
      out += `#EXTVLCOPT:http-user-agent=${safe(ch.userAgent)}\n`;

    // DASH
    if (ch.type === "dash") {
      out += "#KODIPROP:inputstream=inputstream.adaptive\n";
      out += "#KODIPROP:inputstream.adaptive.manifest_type=mpd\n";
    }

    // ClearKey
    if (
      ch.drmScheme === "clearkey" &&
      safe(ch.clearKey)
    ) {
      out += "#KODIPROP:inputstream.adaptive.license_type=org.w3.clearkey\n";
      out += `#KODIPROP:inputstream.adaptive.license_key=${safe(ch.clearKey)}\n`;
    }

    // Widevine
    if (
      ch.drmScheme === "widevine" &&
      safe(ch.licenseUrl)
    ) {
      out += "#KODIPROP:inputstream.adaptive.license_type=com.widevine.alpha\n";
      out += `#KODIPROP:inputstream.adaptive.license_key=${safe(ch.licenseUrl)}\n`;
    }

    // PlayReady
    if (
      ch.drmScheme === "playready" &&
      safe(ch.licenseUrl)
    ) {
      out += "#KODIPROP:inputstream.adaptive.license_type=com.microsoft.playready\n";
      out += `#KODIPROP:inputstream.adaptive.license_key=${safe(ch.licenseUrl)}\n`;
    }

    // STREAM URL (ALWAYS LAST)
    out += `${safe(ch.url)}\n\n`;
  }

  return out;
}
