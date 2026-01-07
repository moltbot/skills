#!/usr/bin/env node
import {
  getListingDetails,
  searchListings,
  summarizeListing,
} from '../src/index.js';

const HELP_TEXT = `
Marktplaats search (all categories)

Usage:
  marktplaats-search "<query>" [options]

Options:
  -n, --limit <num>         Number of results (default: 10, max: 100)
  -c, --category <id>       Category ID filter (top-level category)
  --min-price <cents>       Minimum price in euro cents
  --max-price <cents>       Maximum price in euro cents
  --sort <relevance|date|price-asc|price-desc>
  --param key=value         Filter by attribute (e.g., condition=Nieuw, delivery=Ophalen)
  --details [target]        Fetch details for a listing (use "first" or pass a URL/vip path)
  --json                    Output raw JSON from the API
  -h, --help                Show this help

Examples:
  marktplaats-search "dining table" --sort date
  marktplaats-search "iphone 14" --category 820 --max-price 75000
  marktplaats-search "honda motorcycle" -n 5 --details first
  marktplaats-search "bmw 330d" --min-price 500000 --max-price 1200000 --sort price-asc
  marktplaats-search "laptop" --param condition=Nieuw --param delivery=Verzenden
`.trim();

/**
 * Print CLI help text.
 */
function showHelp() {
  console.log(HELP_TEXT);
}

/**
 * Parse a numeric flag value.
 * @param {string} label Display label for errors.
 * @param {string|undefined} value Raw flag value.
 * @returns {number} Parsed integer.
 */
function parseInteger(label, value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a number.`);
  }
  return parsed;
}

/**
 * Parse CLI arguments into search options.
 * @param {string[]} argv Raw CLI args (process.argv.slice(2)).
 * @returns {{
 *  query: string;
 *  limit?: number;
 *  categoryId?: number;
 *  minPrice?: number;
 *  maxPrice?: number;
 *  sort?: 'relevance'|'date'|'price-asc'|'price-desc';
 *  json: boolean;
 *  help: boolean;
 *  detailsTarget?: string | null;
 *  params: Record<string, string|number>;
 * }}
 */
function parseArgs(argv) {
  const queryParts = [];
  const options = {
    json: false,
    help: false,
    sort: 'relevance',
    detailsTarget: null,
    params: {},
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-n':
      case '--limit':
        options.limit = parseInteger('Limit', argv[++i]);
        break;
      case '-c':
      case '--category':
        options.categoryId = parseInteger('Category ID', argv[++i]);
        break;
      case '--min-price':
        options.minPrice = parseInteger('Minimum price', argv[++i]);
        break;
      case '--max-price':
        options.maxPrice = parseInteger('Maximum price', argv[++i]);
        break;
      case '--sort':
        options.sort = argv[++i];
        break;
      case '--json':
        options.json = true;
        break;
      case '--param': {
        const raw = argv[++i];
        if (!raw || !raw.includes('=')) {
          throw new Error('Use --param key=value');
        }
        const [key, ...rest] = raw.split('=');
        options.params[key] = rest.join('=');
        break;
      }
      case '--details': {
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          options.detailsTarget = next;
          i += 1;
        } else {
          options.detailsTarget = 'first';
        }
        break;
      }
      default:
        if (!arg.startsWith('-')) {
          queryParts.push(arg);
        } else {
          throw new Error(`Unknown argument: ${arg}`);
        }
    }
  }

  const query = queryParts.join(' ').trim();
  if (!options.help && query.length === 0) {
    throw new Error('Please provide a search query (e.g., marktplaats-search "camping tent").');
  }

  return { ...options, query };
}

/**
 * Render a listing to stdout.
 * @param {import('../src/api.js').ListingSummary} listing Listing to print.
 * @param {number} index Position in the results.
 */
function printListing(listing, index) {
  console.log(`${index + 1}. ${listing.title}`);
  console.log(`   Price: ${listing.priceDisplay}${listing.location ? ` | Location: ${listing.location}` : ''}`);
  if (listing.attributes.length > 0) {
    console.log(`   Details: ${listing.attributes.slice(0, 5).join(' | ')}`);
  }
  if (listing.postedAt) {
    console.log(`   Posted: ${listing.postedAt}`);
  }
  if (listing.vipUrl) {
    console.log(`   URL: ${listing.vipUrl}`);
  }
  console.log('');
}

/**
 * Fetch listing details and print a concise summary.
 * @param {string} target Listing identifier, URL, or vip path.
 */
async function fetchAndPrintDetails(target) {
  console.log(`Fetching details for ${target} ...`);
  const details = await getListingDetails(target);
  if (details.description) {
    const snippet = details.description.slice(0, 400);
    console.log(`Description: ${snippet}${details.description.length > 400 ? '…' : ''}`);
  } else {
    console.log('Description: unavailable');
  }
  if (details.priceDisplay) {
    console.log(`Price (from page): ${details.priceDisplay}`);
  }
  if (details.images.length > 0) {
    console.log(`Images: ${details.images.slice(0, 3).join(', ')}${details.images.length > 3 ? ' ...' : ''}`);
  }
  console.log(`Source: ${details.url}`);
  console.log('');
}

/**
 * Show top facets to help users add filters via --param.
 * @param {Array} facets Facets returned by the API.
 */
function printFacetHints(facets) {
  if (!facets || facets.length === 0) return;
  console.log('Filters you can pass with --param:');
  for (const facet of facets.slice(0, 8)) {
    const label = facet.label || facet.key || 'Filter';
    const param = facet.queryParameterName || facet.urlParameterName || facet.key || 'param';
    const sample =
      facet.categories?.slice(0, 3)?.map((c) => c.label || c.name)?.join(' | ') ||
      facet.attributeGroup?.slice(0, 3)?.map((a) => a.attributeValueLabel)?.join(' | ') ||
      '';
    console.log(`  ${label} → ${param}${sample ? ` (e.g., ${sample}${facet.categories?.length > 3 || facet.attributeGroup?.length > 3 ? ' ...' : ''})` : ''}`);
  }
  console.log('');
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('Use --help to see available options.');
    process.exit(1);
  }

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  try {
    const result = await searchListings({
      query: args.query,
      limit: args.limit,
      categoryId: args.categoryId,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
      sort: args.sort,
      params: args.params,
    });

    if (args.json) {
      console.log(JSON.stringify(result.raw, null, 2));
      process.exit(0);
    }

    if (result.listings.length === 0) {
      console.log(`No results found for "${args.query}".`);
      process.exit(0);
    }

    console.log(`Showing ${result.listings.length} of ${result.total} results for "${args.query}".\n`);
    result.listings.forEach((listing, idx) => printListing(listing, idx));

    if (args.detailsTarget) {
      const target = args.detailsTarget === 'first' ? result.listings[0]?.vipUrl || result.listings[0]?.id : args.detailsTarget;
      if (!target) {
        console.error('No listings returned to fetch details for.');
        process.exit(1);
      }
      await fetchAndPrintDetails(target);
    }

    printFacetHints(result.facets);

    const firstFacet = result.facets.find((facet) => facet?.key === 'RelevantCategories');
    if (firstFacet?.categories?.length) {
      const suggestions = firstFacet.categories
        .slice(0, 3)
        .map((cat) => `${cat.label} (id: ${cat.id})`)
        .join(' | ');
      console.log(`Top related categories: ${suggestions}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
