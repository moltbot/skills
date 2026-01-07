#!/usr/bin/env node
/**
 * Core Marktplaats client with search, category lookup, and optional detail fetch.
 *
 * All functions are small, dependency-free, and return normalized objects that
 * work across categories (cars, parts, home goods, etc.).
 */

const BASE_URL = 'https://www.marktplaats.nl/lrp/api/search';
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

/**
 * Common attribute value IDs for filtering.
 * These are universal across Marktplaats categories.
 */
const ATTRIBUTE_IDS = {
  condition: {
    'Nieuw': 30,
    'nieuw': 30,
    'new': 30,
    'Refurbished': 14050,
    'refurbished': 14050,
    'Zo goed als nieuw': 31,
    'zo goed als nieuw': 31,
    'like-new': 31,
    'Gebruikt': 32,
    'gebruikt': 32,
    'used': 32,
    'Niet werkend': 13940,
    'niet werkend': 13940,
    'broken': 13940,
  },
  delivery: {
    'Ophalen': 33,
    'ophalen': 33,
    'pickup': 33,
    'Verzenden': 34,
    'verzenden': 34,
    'shipping': 34,
  },
  buyitnow: {
    'Direct Kopen': 14055,
    'direct kopen': 14055,
    'true': 14055,
    '1': 14055,
  },
};

/**
 * @typedef {Object} SearchOptions
 * @property {string} query Human-friendly search query (required).
 * @property {number} [limit] Maximum number of results (default 10, max 100).
 * @property {number} [categoryId] Optional category ID (l1CategoryId).
 * @property {number} [minPrice] Minimum price in euro cents.
 * @property {number} [maxPrice] Maximum price in euro cents.
 * @property {'relevance'|'date'|'price-asc'|'price-desc'} [sort] Sorting strategy.
 * @property {Record<string, string|number>} [params] Additional raw query parameters passed through to the API.
 * @property {number[]} [attributeIds] Attribute value IDs for filtering (advanced).
 */

/**
 * @typedef {Object} ListingSummary
 * @property {string} id Listing identifier (stringified).
 * @property {string} title Listing title.
 * @property {number|null} priceCents Price in euro cents (null when not provided).
 * @property {string} priceDisplay Human readable price text.
 * @property {string|null} location Location label (city or region when available).
 * @property {string|null} postedAt Raw date string from API.
 * @property {string|null} vipUrl Full URL to the listing page.
 * @property {string[]} attributes Key attributes (year, mileage, fuel, etc.).
 * @property {object} raw Raw listing payload for advanced consumers.
 */

/**
 * @typedef {Object} SearchResult
 * @property {ListingSummary[]} listings Normalized listings.
 * @property {number} total Total number of results reported by the API.
 * @property {Array} facets Raw facet data returned by the API.
 * @property {Array} categories Raw category options returned by the API.
 * @property {object} raw Full unmodified API response.
 */

/**
 * @typedef {Object} CategoriesResult
 * @property {Array} categories Category options (top-level or sub-categories).
 * @property {Array} facets Facet groups returned by the API (filters).
 * @property {object} raw Full unmodified API response.
 */

/**
 * @typedef {Object} ListingDetails
 * @property {string} url Fully qualified listing URL that was fetched.
 * @property {string|null} description Description text when available.
 * @property {string|null} priceDisplay Price pulled from structured data when present.
 * @property {string[]} images Image URLs if exposed in structured data.
 * @property {object|null} structuredData Parsed JSON-LD payload when available.
 * @property {number} contentLength Length of the fetched HTML payload (for debugging).
 */

/**
 * Convert friendly filter params to attribute IDs.
 * E.g., { condition: 'Nieuw', delivery: 'Verzenden' } → [30, 34]
 * @param {Record<string, string|number>} params User-provided params.
 * @returns {{ attributeIds: number[], passthrough: Record<string, string|number> }}
 */
function parseFilterParams(params) {
  const attributeIds = [];
  const passthrough = {};

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a known attribute filter
    if (ATTRIBUTE_IDS[lowerKey]) {
      const id = ATTRIBUTE_IDS[lowerKey][value] || ATTRIBUTE_IDS[lowerKey][String(value).toLowerCase()];
      if (id) {
        attributeIds.push(id);
        continue;
      }
    }
    
    // Check if value is a direct attribute ID (number)
    if (key === 'attributeId' || key === 'id') {
      const numId = parseInt(value, 10);
      if (!isNaN(numId)) {
        attributeIds.push(numId);
        continue;
      }
    }
    
    // Pass through as raw param
    passthrough[key] = value;
  }

  return { attributeIds, passthrough };
}

/**
 * Validate and normalize search options.
 * @param {SearchOptions} options User provided options.
 * @returns {SearchOptions & {limit: number, sort: 'relevance'|'date'|'price-asc'|'price-desc', params: Record<string, string|number>, attributeIds: number[]}} Normalized options with defaults applied.
 */
function normalizeSearchOptions(options) {
  if (!options || typeof options.query !== 'string' || options.query.trim().length === 0) {
    throw new Error('A non-empty search query is required.');
  }

  // Parse filter params to extract attribute IDs
  const { attributeIds, passthrough } = parseFilterParams(options.params ?? {});

  const normalized = {
    query: options.query.trim(),
    limit: Math.min(Math.max(Number(options.limit ?? 10), 1), 100),
    categoryId: options.categoryId != null ? Number(options.categoryId) : undefined,
    minPrice: options.minPrice != null ? Number(options.minPrice) : undefined,
    maxPrice: options.maxPrice != null ? Number(options.maxPrice) : undefined,
    sort: options.sort ?? 'relevance',
    params: passthrough,
    attributeIds: [...attributeIds, ...(options.attributeIds ?? [])],
  };

  if (Number.isNaN(normalized.limit)) {
    throw new Error('Limit must be a number.');
  }
  if (normalized.sort && !['relevance', 'date', 'price-asc', 'price-desc'].includes(normalized.sort)) {
    throw new Error('Invalid sort option. Use relevance, date, price-asc, or price-desc.');
  }

  return normalized;
}

/**
 * Build the Marktplaats search URL.
 * @param {ReturnType<typeof normalizeSearchOptions>} options Normalized options.
 * @returns {string} Fully qualified search URL.
 */
function buildSearchUrl(options) {
  const params = new URLSearchParams({
    query: options.query,
    limit: options.limit.toString(),
  });

  if (options.categoryId != null) {
    params.set('l1CategoryId', options.categoryId.toString());
  }
  if (options.minPrice != null) {
    params.set('priceFrom', options.minPrice.toString());
  }
  if (options.maxPrice != null) {
    params.set('priceTo', options.maxPrice.toString());
  }

  if (options.sort === 'date') {
    params.set('sortBy', 'SORT_INDEX');
    params.set('sortOrder', 'DECREASING');
  } else if (options.sort === 'price-asc') {
    params.set('sortBy', 'PRICE');
    params.set('sortOrder', 'INCREASING');
  } else if (options.sort === 'price-desc') {
    params.set('sortBy', 'PRICE');
    params.set('sortOrder', 'DECREASING');
  }

  // Add attribute IDs for filtering
  if (options.attributeIds && options.attributeIds.length > 0) {
    options.attributeIds.forEach((id, idx) => {
      params.set(`attributesById[${idx}]`, id.toString());
    });
  }

  // Pass through any raw query parameters provided by the caller.
  for (const [key, value] of Object.entries(options.params)) {
    if (value != null) {
      params.set(key, String(value));
    }
  }

  return `${BASE_URL}?${params.toString()}`;
}

/**
 * Convert a raw listing from the Marktplaats API into a stable summary object.
 * @param {any} item Raw listing from the API.
 * @returns {ListingSummary} Normalized listing with useful fields.
 */
function normalizeListing(item) {
  const priceCents = typeof item?.priceInfo?.priceCents === 'number' ? item.priceInfo.priceCents : null;
  const priceType = item?.priceInfo?.priceType;
  const attributes = [];

  if (Array.isArray(item?.attributes)) {
    for (const attr of item.attributes) {
      if (attr?.key && attr?.value) {
        attributes.push(`${attr.key}: ${attr.value}`);
      }
    }
  }
  if (Array.isArray(item?.extendedAttributes)) {
    for (const attr of item.extendedAttributes) {
      if (attr?.key && attr?.value && !attributes.includes(`${attr.key}: ${attr.value}`)) {
        attributes.push(`${attr.key}: ${attr.value}`);
      }
    }
  }

  const priceDisplay = (() => {
    if (priceCents != null) {
      return `€${(priceCents / 100).toLocaleString('nl-NL')}`;
    }
    if (priceType === 'ON_REQUEST') return 'On request';
    if (priceType === 'NOT_APPLICABLE') return 'Not applicable';
    if (priceType === 'FAST_BID') return '€0';
    if (priceType === 'SEE_DESCRIPTION') return 'See description';
    return 'N/A';
  })();

  const location = item?.location?.cityName || item?.location?.countryName || null;
  const vipUrl = item?.vipUrl ? `https://www.marktplaats.nl${item.vipUrl}` : null;

  return {
    id: String(item?.itemId ?? item?.id ?? ''),
    title: item?.title ?? 'Untitled',
    priceCents,
    priceDisplay,
    location,
    postedAt: item?.date ?? null,
    vipUrl,
    attributes,
    raw: item,
  };
}

/**
 * Search Marktplaats listings.
 * @param {SearchOptions} options Search options.
 * @returns {Promise<SearchResult>} Search results with normalized listings.
 */
async function searchListings(options) {
  const normalizedOptions = normalizeSearchOptions(options);
  const url = buildSearchUrl(normalizedOptions);

  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!response.ok) {
    throw new Error(`Search failed with HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const rawListings = data.listings ?? [];

  return {
    listings: rawListings.map(normalizeListing),
    total: data.totalResultCount ?? rawListings.length,
    facets: data.facets ?? [],
    categories: data.searchCategoryOptions ?? [],
    raw: data,
  };
}

/**
 * Fetch category options from the Marktplaats API.
 * @param {number} [parentId] Optional parent category ID to fetch sub-categories.
 * @returns {Promise<CategoriesResult>} Categories and filter information.
 */
async function fetchCategories(parentId) {
  const params = new URLSearchParams({ query: '', limit: '0' });
  if (parentId != null) {
    params.set('l1CategoryId', parentId.toString());
  }

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!response.ok) {
    throw new Error(`Categories fetch failed with HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Extract category options from the response.
  const cats = data.searchCategoryOptions ?? [];
  const facets = data.facets ?? [];

  return { categories: cats, facets, raw: data };
}

/**
 * Fetch detailed information for a single listing by URL or VIP path.
 * @param {string} urlOrPath Full URL or vip path (e.g., /v/...).
 * @returns {Promise<ListingDetails>} Detailed information parsed from the listing page.
 */
async function getListingDetails(urlOrPath) {
  const fullUrl = urlOrPath.startsWith('http') ? urlOrPath : `https://www.marktplaats.nl${urlOrPath}`;

  const response = await fetch(fullUrl, {
    headers: {
      ...DEFAULT_HEADERS,
      Accept: 'text/html',
    },
  });
  if (!response.ok) {
    throw new Error(`Listing page fetch failed with HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  // Extract structured JSON-LD data when available.
  let structuredData = null;
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      structuredData = JSON.parse(jsonLdMatch[1]);
    } catch {
      // Ignore parse errors.
    }
  }

  // Extract description from meta tag or og:description.
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i) ||
                    html.match(/<meta property="og:description" content="([^"]+)"/i);
  const description = descMatch ? descMatch[1] : null;

  // Extract price from structured data or og:price.
  const priceMatch = html.match(/<meta property="product:price:amount" content="([^"]+)"/i);
  const priceDisplay = priceMatch ? `€${priceMatch[1]}` : structuredData?.offers?.price ? `€${structuredData.offers.price}` : null;

  // Extract image URLs from structured data.
  const images = [];
  if (structuredData?.image) {
    const imgList = Array.isArray(structuredData.image) ? structuredData.image : [structuredData.image];
    images.push(...imgList.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean));
  }

  return {
    url: fullUrl,
    description,
    priceDisplay,
    images,
    structuredData,
    contentLength: html.length,
  };
}

/**
 * Get attribute ID for a filter value.
 * @param {string} filterKey Filter key (e.g., 'condition', 'delivery').
 * @param {string} value Filter value (e.g., 'Nieuw', 'Ophalen').
 * @returns {number|null} Attribute ID or null if not found.
 */
function getAttributeId(filterKey, value) {
  const key = filterKey.toLowerCase();
  if (ATTRIBUTE_IDS[key]) {
    return ATTRIBUTE_IDS[key][value] || ATTRIBUTE_IDS[key][value.toLowerCase()] || null;
  }
  return null;
}

/**
 * List available filter values for a key.
 * @param {string} filterKey Filter key (e.g., 'condition', 'delivery').
 * @returns {string[]} Available values for the filter.
 */
function getFilterValues(filterKey) {
  const key = filterKey.toLowerCase();
  if (ATTRIBUTE_IDS[key]) {
    // Return unique labels (skip duplicates from case variants)
    const seen = new Set();
    return Object.keys(ATTRIBUTE_IDS[key]).filter(v => {
      const lower = v.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      // Only return properly capitalized versions
      return v[0] === v[0].toUpperCase();
    });
  }
  return [];
}


/**
 * Create a one-line summary of a listing.
 * @param {ListingSummary} listing Normalized listing.
 * @returns {string} Summary string.
 */
function summarizeListing(listing) {
  const parts = [];
  parts.push(listing.title);
  parts.push(listing.priceDisplay);
  if (listing.location) parts.push(listing.location);
  if (listing.attributes.length > 0) parts.push(listing.attributes.slice(0, 3).join(' | '));
  return parts.join(' — ');
}

export {
  searchListings,
  fetchCategories,
  getListingDetails,
  getAttributeId,
  getFilterValues,
  summarizeListing,
  ATTRIBUTE_IDS,
};
