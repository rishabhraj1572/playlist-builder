# Playlist Builder

A Vercel-ready Next.js app for managing lawful HLS/DASH stream entries in the browser and exporting a raw M3U playlist.

## Features

- Add / edit / delete channels
- Logo URL, stream URL, type, group title, TVG ID
- Optional HTTP metadata headers:
  - origin
  - referer
  - cookie
  - user-agent
- Local browser JSON storage
- Copy playlist URL
- Copy M3U
- Download M3U
- Import / export JSON
- Search/filter channels

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Deploy.

## Notes

- The app stores channel data in browser localStorage so it works without a database.
- The `/api/playlist` route can generate a raw M3U from encoded JSON passed in the `data` query parameter.
- Use this only for streams you are authorized to access.
