// Soundcloud tracks configuration
// Add your Soundcloud track/playlist URLs here
// To get the embed URL: Go to track on Soundcloud > Share > Embed > Copy the src URL

export interface Track {
  title: string;
  artist: string;
  embedUrl: string; // The URL from Soundcloud's embed iframe src
  addedDate: string; // YYYY-MM-DD format
}

export const tracks: Track[] = [
  // Example format - replace with your actual tracks:
  // {
  //   title: "Track Name",
  //   artist: "Artist Name",
  //   embedUrl: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/TRACK_ID",
  //   addedDate: "2026-01-22",
  // },
];

// Get the most recent tracks (up to limit)
export function getRecentTracks(limit: number = 10): Track[] {
  return [...tracks]
    .sort((a, b) => new Date(b.addedDate).valueOf() - new Date(a.addedDate).valueOf())
    .slice(0, limit);
}
