export type StreamType = "hls" | "dash";
export type DrmScheme = "none" | "clearkey" | "widevine" | "playready";

export type Channel = {
  id: string;

  name: string;
  logo: string;

  url: string;
  type: StreamType;

  groupTitle: string;
  tvgId: string;
  description: string;

  origin: string;
  referer: string;
  cookie: string;
  userAgent: string;
  drmScheme: DrmScheme;
  licenseUrl: string;
  clearKey: string;

  createdAt: number;
  updatedAt: number;
};
