import { NextRequest } from "next/server";
import { decodePlaylistData, generateM3U } from "../../../lib/playlist";
import type { Channel } from "../../../lib/types";

function emptyResponse() {
  return new Response("#EXTM3U\n", {
    headers: {
      "Content-Type": "application/x-mpegURL; charset=utf-8",
      "Content-Disposition": 'inline; filename="playlist.m3u"'
    }
  });
}

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) return emptyResponse();

  try {
    const channels = decodePlaylistData(data) as Channel[];
    const m3u = generateM3U(channels);
    return new Response(m3u, {
      headers: {
        "Content-Type": "application/x-mpegURL; charset=utf-8",
        "Content-Disposition": 'inline; filename="playlist.m3u"'
      }
    });
  } catch {
    return new Response("Invalid playlist data", { status: 400 });
  }
}
