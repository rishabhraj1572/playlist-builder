# Playlist Builder

A Vercel-ready Next.js app for managing lawful HLS/DASH stream entries in the browser and exporting a raw M3U playlist.

## Added features

- Notes field per channel
- Duplicate channel
- Move up / down reorder
- Bulk add from pasted text
- Download JSON backup
- Better stats
- Notes exported into the M3U as comments
- Search/filter across more fields

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Deploy.

## Notes

- The app stores channel data in browser localStorage so it works without a separate database.
- The `/api/playlist` route can generate a raw M3U from encoded JSON passed in the `data` query parameter.
- Use this only with streams you are authorized to access.
