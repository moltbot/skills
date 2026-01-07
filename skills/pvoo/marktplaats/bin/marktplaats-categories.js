#!/usr/bin/env node
import { fetchCategories } from '../src/index.js';

const HELP_TEXT = `
Marktplaats categories explorer

Usage:
  marktplaats-categories            Show all main categories
  marktplaats-categories <id>       Show sub-categories for the given category

Options:
  --json          Output raw JSON
  -h, --help      Show this help

Examples:
  marktplaats-categories
  marktplaats-categories 91        # Sub-categories for Cars
  marktplaats-categories 504       # Sub-categories for Home & Living
`.trim();

/**
 * Render category rows to stdout.
 * @param {Array} categories Category list from the API.
 */
function printCategories(categories) {
  if (!categories || categories.length === 0) {
    console.log('No categories returned.');
    return;
  }
  for (const cat of categories) {
    const label = cat.label || cat.name || 'Unnamed';
    console.log(`${String(cat.id).padEnd(8)} ${label}`);
  }
}

/**
 * Render a short list of available filters from facets.
 * @param {Array} facets Facet list from the API.
 */
function printFilters(facets) {
  if (!facets || facets.length === 0) return;
  console.log('\nFilters you can use in search (pass with --param):');
  for (const facet of facets.slice(0, 8)) {
    const label = facet.label || facet.key || 'Filter';
    const param = facet.queryParameterName || facet.urlParameterName || facet.key || 'param';
    const values = facet.categories?.slice(0, 4)?.map((c) => c.label || c.name)?.join(' | ')
      || facet.attributeGroup?.slice(0, 4)?.map((a) => a.attributeValueLabel)?.join(' | ')
      || '';
    console.log(`  ${label} → use ?${param}=... ${values ? `(${values}${facet.categories?.length > 4 || facet.attributeGroup?.length > 4 ? ' ...' : ''})` : ''}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const showHelp = argv.includes('-h') || argv.includes('--help');
  const json = argv.includes('--json');
  const parentArg = argv.find((arg) => !arg.startsWith('-'));
  const parentId = parentArg ? Number(parentArg) : undefined;

  if (showHelp) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (parentArg && Number.isNaN(parentId)) {
    console.error('Category ID must be a number.');
    process.exit(1);
  }

  try {
    const result = await fetchCategories(parentId);
    if (json) {
      console.log(JSON.stringify(result.raw, null, 2));
      process.exit(0);
    }

    if (parentId == null) {
      console.log('Main categories:\n');
    } else {
      console.log(`Sub-categories for ${parentId}:\n`);
    }

    printCategories(result.categories);
    printFilters(result.facets);

    if (parentId == null) {
      console.log('\nTip: marktplaats-search "<query>" --json shows facets for additional filters.');
    } else {
      console.log('\nTip: Use --param <key>=<value> with marktplaats-search using the filter keys above.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
