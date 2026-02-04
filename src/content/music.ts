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
    name: "Sets",
    description: "Running list of burner techno, bounce, downtempo, uptempo/psytrance/psytechno...heavily inspired by labels like Akumandra, Souq Records/Alt Orient, KataHaifisch, and Tipping Point. Also includes some favorites from Boom Fest '23 and '25",
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

// Soundcloud likes feed configuration
// The widget requires your numeric user ID, not your profile URL.
// To find your user ID: visit https://soundcloud.com/oembed?url=https://soundcloud.com/YOUR_USERNAME&format=json
// and look for the number in the "users/XXXXXXX" part of the html field.

export interface SoundcloudFeed {
  name: string;
  description?: string;
  userId: number; // Soundcloud numeric user ID
}

export const feeds: SoundcloudFeed[] = [
  {
    name: "Likes",
    userId: 8374044,
  },
];

// Build a Soundcloud embed URL for a user's likes
export function getFeedEmbedUrl(userId: number): string {
  const apiUrl = `https://api.soundcloud.com/users/${userId}/favorites`;
  const params = new URLSearchParams({
    url: apiUrl,
    color: "#ff5500",
    auto_play: "false",
    hide_related: "false",
    show_comments: "true",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "true",
    visual: "false",
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
