/**
 * App Store API Utility
 *
 * Uses Apple's iTunes Search API to fetch competitor data from the App Store.
 * API Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI
 *
 * Rate Limits:
 * - ~20 calls per minute (not officially documented, subject to change)
 * - For heavy usage, Apple recommends Enterprise Partner Feed (EPF)
 * - Implement caching for repeated searches
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Raw response from iTunes Search API
 */
interface ITunesSearchResponse {
  resultCount: number;
  results: ITunesAppResult[];
}

/**
 * Raw app result from iTunes API
 */
interface ITunesAppResult {
  // Core identifiers
  trackId: number;
  trackName: string;
  bundleId: string;

  // Developer info
  artistId: number;
  artistName: string;
  sellerName?: string;
  sellerUrl?: string;
  artistViewUrl?: string;

  // Ratings & Reviews
  averageUserRating?: number;
  averageUserRatingForCurrentVersion?: number;
  userRatingCount?: number;
  userRatingCountForCurrentVersion?: number;

  // Pricing
  price: number;
  formattedPrice?: string;
  currency: string;

  // Visual assets
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl512?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];

  // Metadata
  description?: string;
  releaseNotes?: string;
  version?: string;
  primaryGenreName?: string;
  primaryGenreId?: number;
  genreIds?: string[];
  genres?: string[];
  contentAdvisoryRating?: string;
  minimumOsVersion?: string;
  fileSizeBytes?: string;
  languageCodesISO2A?: string[];
  supportedDevices?: string[];

  // URLs
  trackViewUrl?: string;
  trackContentRating?: string;

  // Dates
  releaseDate?: string;
  currentVersionReleaseDate?: string;

  // Features
  isGameCenterEnabled?: boolean;
  features?: string[];
  isVppDeviceBasedLicensingEnabled?: boolean;
}

/**
 * Cleaned up app data for our use case
 */
export interface AppStoreApp {
  // Core
  id: number;
  name: string;
  bundleId: string;

  // Developer
  developerId: number;
  developerName: string;
  developerUrl?: string;

  // Ratings
  rating: number;
  ratingCount: number;
  currentVersionRating?: number;
  currentVersionRatingCount?: number;

  // Price
  price: number;
  formattedPrice: string;
  currency: string;
  isFree: boolean;

  // Visual
  iconUrl: string;
  iconUrlLarge?: string;
  screenshotUrls: string[];

  // Metadata
  description: string;
  releaseNotes?: string;
  version?: string;
  category: string;
  categoryId?: number;
  categories: string[];
  ageRating?: string;
  minimumOsVersion?: string;
  fileSizeBytes?: number;
  languages: string[];

  // URLs
  appStoreUrl: string;

  // Dates
  releaseDate?: Date;
  lastUpdated?: Date;
}

/**
 * Search options for App Store queries
 */
export interface SearchOptions {
  /** Country code (ISO 3166-1 alpha-2). Default: 'us' */
  country?: string;
  /** Maximum results (1-200). Default: 25 */
  limit?: number;
  /** Language code. Default: 'en_us' */
  language?: string;
}

/**
 * Competitor analysis result
 */
export interface CompetitorAnalysis {
  searchTerm: string;
  totalResults: number;
  apps: AppStoreApp[];
  averageRating: number;
  averageRatingCount: number;
  freeAppCount: number;
  paidAppCount: number;
  averagePrice: number;
  topCategories: Array<{ category: string; count: number }>;
  fetchedAt: Date;
}

// =============================================================================
// API Functions
// =============================================================================

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';

/**
 * Transform raw iTunes result to our cleaner format
 */
function transformApp(raw: ITunesAppResult): AppStoreApp {
  return {
    // Core
    id: raw.trackId,
    name: raw.trackName,
    bundleId: raw.bundleId,

    // Developer
    developerId: raw.artistId,
    developerName: raw.artistName,
    developerUrl: raw.artistViewUrl,

    // Ratings (default to 0 if not available)
    rating: raw.averageUserRating ?? 0,
    ratingCount: raw.userRatingCount ?? 0,
    currentVersionRating: raw.averageUserRatingForCurrentVersion,
    currentVersionRatingCount: raw.userRatingCountForCurrentVersion,

    // Price
    price: raw.price,
    formattedPrice: raw.formattedPrice ?? (raw.price === 0 ? 'Free' : `$${raw.price}`),
    currency: raw.currency,
    isFree: raw.price === 0,

    // Visual - prefer larger icons
    iconUrl: raw.artworkUrl100 ?? raw.artworkUrl60 ?? '',
    iconUrlLarge: raw.artworkUrl512,
    screenshotUrls: raw.screenshotUrls ?? [],

    // Metadata
    description: raw.description ?? '',
    releaseNotes: raw.releaseNotes,
    version: raw.version,
    category: raw.primaryGenreName ?? 'Unknown',
    categoryId: raw.primaryGenreId,
    categories: raw.genres ?? [],
    ageRating: raw.contentAdvisoryRating,
    minimumOsVersion: raw.minimumOsVersion,
    fileSizeBytes: raw.fileSizeBytes ? parseInt(raw.fileSizeBytes, 10) : undefined,
    languages: raw.languageCodesISO2A ?? [],

    // URLs
    appStoreUrl: raw.trackViewUrl ?? `https://apps.apple.com/app/id${raw.trackId}`,

    // Dates
    releaseDate: raw.releaseDate ? new Date(raw.releaseDate) : undefined,
    lastUpdated: raw.currentVersionReleaseDate
      ? new Date(raw.currentVersionReleaseDate)
      : undefined,
  };
}

/**
 * Search the App Store for apps matching a keyword
 *
 * @example
 * const apps = await searchApps('budget tracker');
 * console.log(apps[0].name, apps[0].rating);
 */
export async function searchApps(
  term: string,
  options: SearchOptions = {}
): Promise<AppStoreApp[]> {
  const { country = 'us', limit = 25, language = 'en_us' } = options;

  // Build search URL
  const params = new URLSearchParams({
    term: term,
    entity: 'software', // iOS apps
    country: country,
    limit: Math.min(Math.max(limit, 1), 200).toString(),
    lang: language,
  });

  const url = `${ITUNES_SEARCH_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: ITunesSearchResponse = await response.json();

    return data.results.map(transformApp);
  } catch (error) {
    console.error('App Store search failed:', error);
    throw error;
  }
}

/**
 * Look up a specific app by its App Store ID
 *
 * @example
 * const app = await lookupApp(310633997); // WhatsApp
 */
export async function lookupApp(
  appId: number,
  country = 'us'
): Promise<AppStoreApp | null> {
  const params = new URLSearchParams({
    id: appId.toString(),
    country: country,
  });

  const url = `${ITUNES_LOOKUP_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: ITunesSearchResponse = await response.json();

    if (data.resultCount === 0) {
      return null;
    }

    return transformApp(data.results[0]);
  } catch (error) {
    console.error('App Store lookup failed:', error);
    throw error;
  }
}

/**
 * Look up an app by its bundle ID
 *
 * @example
 * const app = await lookupByBundleId('com.google.Maps');
 */
export async function lookupByBundleId(
  bundleId: string,
  country = 'us'
): Promise<AppStoreApp | null> {
  const params = new URLSearchParams({
    bundleId: bundleId,
    country: country,
  });

  const url = `${ITUNES_LOOKUP_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: ITunesSearchResponse = await response.json();

    if (data.resultCount === 0) {
      return null;
    }

    return transformApp(data.results[0]);
  } catch (error) {
    console.error('App Store bundle lookup failed:', error);
    throw error;
  }
}

/**
 * Get apps by a specific developer
 *
 * @example
 * const apps = await getAppsByDeveloper(284417353); // Apple Inc.
 */
export async function getAppsByDeveloper(
  developerId: number,
  options: SearchOptions = {}
): Promise<AppStoreApp[]> {
  const { country = 'us', limit = 50 } = options;

  const params = new URLSearchParams({
    id: developerId.toString(),
    entity: 'software',
    country: country,
    limit: Math.min(Math.max(limit, 1), 200).toString(),
  });

  const url = `${ITUNES_LOOKUP_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
    }

    const data: ITunesSearchResponse = await response.json();

    // Filter out artist entries, keep only software
    return data.results
      .filter((r) => r.trackId !== undefined)
      .map(transformApp);
  } catch (error) {
    console.error('Developer apps lookup failed:', error);
    throw error;
  }
}

/**
 * Analyze competitors for a given search term
 * Returns aggregated insights about the competitive landscape
 *
 * @example
 * const analysis = await analyzeCompetitors('expense tracker', { limit: 50 });
 * console.log('Average rating:', analysis.averageRating);
 * console.log('Free vs Paid:', analysis.freeAppCount, 'vs', analysis.paidAppCount);
 */
export async function analyzeCompetitors(
  searchTerm: string,
  options: SearchOptions = {}
): Promise<CompetitorAnalysis> {
  const apps = await searchApps(searchTerm, { ...options, limit: options.limit ?? 50 });

  // Calculate aggregates
  const appsWithRatings = apps.filter((app) => app.rating > 0);
  const averageRating =
    appsWithRatings.length > 0
      ? appsWithRatings.reduce((sum, app) => sum + app.rating, 0) / appsWithRatings.length
      : 0;

  const averageRatingCount =
    appsWithRatings.length > 0
      ? appsWithRatings.reduce((sum, app) => sum + app.ratingCount, 0) /
        appsWithRatings.length
      : 0;

  const freeApps = apps.filter((app) => app.isFree);
  const paidApps = apps.filter((app) => !app.isFree);
  const averagePrice =
    paidApps.length > 0
      ? paidApps.reduce((sum, app) => sum + app.price, 0) / paidApps.length
      : 0;

  // Count categories
  const categoryCount = new Map<string, number>();
  for (const app of apps) {
    for (const cat of app.categories) {
      categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
    }
  }

  const topCategories = Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    searchTerm,
    totalResults: apps.length,
    apps,
    averageRating: Math.round(averageRating * 100) / 100,
    averageRatingCount: Math.round(averageRatingCount),
    freeAppCount: freeApps.length,
    paidAppCount: paidApps.length,
    averagePrice: Math.round(averagePrice * 100) / 100,
    topCategories,
    fetchedAt: new Date(),
  };
}

// =============================================================================
// App Store Category IDs (for reference)
// =============================================================================

/**
 * Common iOS App Store category IDs
 * Use these with genre-based filtering if needed
 */
export const APP_STORE_CATEGORIES = {
  // Main categories
  BOOKS: 6018,
  BUSINESS: 6000,
  DEVELOPER_TOOLS: 6026,
  EDUCATION: 6017,
  ENTERTAINMENT: 6016,
  FINANCE: 6015,
  FOOD_DRINK: 6023,
  GAMES: 6014,
  GRAPHICS_DESIGN: 6027,
  HEALTH_FITNESS: 6013,
  LIFESTYLE: 6012,
  MAGAZINES_NEWSPAPERS: 6021,
  MEDICAL: 6020,
  MUSIC: 6011,
  NAVIGATION: 6010,
  NEWS: 6009,
  PHOTO_VIDEO: 6008,
  PRODUCTIVITY: 6007,
  REFERENCE: 6006,
  SHOPPING: 6024,
  SOCIAL_NETWORKING: 6005,
  SPORTS: 6004,
  TRAVEL: 6003,
  UTILITIES: 6002,
  WEATHER: 6001,
} as const;

// =============================================================================
// Simple in-memory cache (optional, for rate limit protection)
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Cached version of searchApps to respect rate limits
 */
export async function searchAppsCached(
  term: string,
  options: SearchOptions = {}
): Promise<AppStoreApp[]> {
  const cacheKey = `search:${term}:${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as AppStoreApp[];
  }

  const result = await searchApps(term, options);
  cache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

/**
 * Clear the API cache
 */
export function clearCache(): void {
  cache.clear();
}
