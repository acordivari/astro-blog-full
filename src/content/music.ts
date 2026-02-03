// Soundcloud playlists configuration
// Each playlist is a single Soundcloud playlist URL containing multiple mixes/sets
// To get the embed URL: Go to the playlist on Soundcloud > Share > Embed > Copy the src URL

export interface Playlist {
  name: string;
  description?: string;
  artist?: string; // Optional: if playlist is by a single artist
  embedUrl: string; // The Soundcloud playlist embed URL
  addedDate: string; // YYYY-MM-DD format
}

export const playlists: Playlist[] = [
  {
    name: "House & Techno",
    description: "Deep house and techno sets",
    embedUrl: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A432070671&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true",
    addedDate: "2026-01-22",
  },
];

// Get all playlists sorted by date (most recent first)
export function getPlaylists(): Playlist[] {
  return [...playlists].sort(
    (a, b) => new Date(b.addedDate).valueOf() - new Date(a.addedDate).valueOf()
  );
}

// Get recent playlists (up to limit)
export function getRecentPlaylists(limit: number = 10): Playlist[] {
  return getPlaylists().slice(0, limit);
}
