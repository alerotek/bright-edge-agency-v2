/**
 * V2 Video Provider Detection
 * --------------------------------------------------------------
 * We never store video files. We only store URLs to videos the
 * agent has already published on social platforms. This module
 * detects the provider, normalizes the URL, and produces the
 * correct embed URL + thumbnail.
 *
 * Supported providers: YouTube, TikTok, Instagram Reels, Facebook Reels.
 */

export type VideoProvider = "youtube" | "tiktok" | "instagram" | "facebook" | "unknown";

export type DetectedVideo = {
  provider: VideoProvider;
  isValid: boolean;
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  originalUrl: string;
};

const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,15})/i,
];

const TIKTOK_PATTERNS = [
  /tiktok\.com\/@[\w.-]+\/video\/(\d+)/i,
  /vm\.tiktok\.com\/([A-Za-z0-9]+)/i,
];

const IG_PATTERNS = [
  /instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i,
];

const FB_PATTERNS = [
  /facebook\.com\/(?:[\w.-]+\/videos|reel|watch)\/(\d+|[A-Za-z0-9]+)/i,
  /fb\.watch\/([A-Za-z0-9_-]+)/i,
];

function firstMatch(url: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

export function detectVideoProvider(url: string | null | undefined): DetectedVideo {
  const original = (url ?? "").trim();
  if (!original) {
    return {
      provider: "unknown",
      isValid: false,
      videoId: null,
      embedUrl: null,
      thumbnailUrl: null,
      originalUrl: "",
    };
  }

  // YouTube
  const ytId = firstMatch(original, YT_PATTERNS);
  if (ytId) {
    return {
      provider: "youtube",
      isValid: true,
      videoId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}?modestbranding=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      originalUrl: original,
    };
  }

  // TikTok
  const ttId = firstMatch(original, TIKTOK_PATTERNS);
  if (ttId) {
    return {
      provider: "tiktok",
      isValid: true,
      videoId: ttId,
      embedUrl: `https://www.tiktok.com/embed/v2/${ttId}`,
      thumbnailUrl: null, // TikTok does not expose stable thumbnails without an API
      originalUrl: original,
    };
  }

  // Instagram
  const igId = firstMatch(original, IG_PATTERNS);
  if (igId) {
    return {
      provider: "instagram",
      isValid: true,
      videoId: igId,
      embedUrl: `https://www.instagram.com/p/${igId}/embed/`,
      thumbnailUrl: null,
      originalUrl: original,
    };
  }

  // Facebook
  const fbId = firstMatch(original, FB_PATTERNS);
  if (fbId) {
    return {
      provider: "facebook",
      isValid: true,
      videoId: fbId,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(original)}&show_text=false`,
      thumbnailUrl: null,
      originalUrl: original,
    };
  }

  return {
    provider: "unknown",
    isValid: false,
    videoId: null,
    embedUrl: null,
    thumbnailUrl: null,
    originalUrl: original,
  };
}

/**
 * Returns true if the URL is a recognised provider.
 */
export function isValidVideoUrl(url: string | null | undefined): boolean {
  return detectVideoProvider(url).isValid;
}
