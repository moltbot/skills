#!/usr/bin/env node

import https from 'https';
import * as cheerio from 'cheerio';
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

const program = new Command();

program
  .name('x-trends')
  .description('Get rich X (Twitter) trending data for any country')
  .version('1.2.0')
  .option('-c, --country <codeOrName>', 'Country code (e.g. us, india, uk)', 'india')
  .option('-l, --limit <number>', 'Number of trends to display', '20')
  .option('-j, --json', 'Output results as JSON')
  .option('-v, --verbose', 'Show tweet volume if available')
  .parse(process.argv);

const options = program.opts();

const countryMap = {
  'us': 'united-states',
  'usa': 'united-states',
  'uk': 'united-kingdom',
  'uae': 'united-arab-emirates',
  'in': 'india',
  'global': '' // World trends
};

let countrySlug = options.country.toLowerCase();
if (countryMap[countrySlug] !== undefined) {
  countrySlug = countryMap[countrySlug];
}
if (countrySlug === 'world' || countrySlug === 'global') {
  countrySlug = ''; // Root path is usually worldwide
}

const url = `https://getdaytrends.com/${countrySlug ? countrySlug + '/' : ''}`;

const fetchTrends = (targetUrl) => {
  return new Promise((resolve, reject) => {
    const req = https.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode === 404) {
        reject(new Error(`Country '${countrySlug}' not found.`));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch trends. Status Code: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', (e) => reject(e));
  });
};

const run = async () => {
  const spinner = !options.json ? ora(`Fetching trends for ${chalk.bold(countrySlug || 'Worldwide')}...`).start() : null;

  try {
    const html = await fetchTrends(url);
    const $ = cheerio.load(html);
    const trends = [];

    // Iterate over table rows to get details
    $('table.trends tbody tr').each((i, el) => {
      const name = $(el).find('.main a').text().trim();
      const link = 'https://getdaytrends.com' + $(el).find('.main a').attr('href');
      const volume = $(el).find('.desc').text().trim() || 'N/A';
      
      if (name) {
        trends.push({
          rank: i + 1,
          name,
          volume: volume.replace('Under ', '<'), // Clean up text
          link
        });
      }
    });

    if (spinner) spinner.stop();

    if (trends.length === 0) {
      if (options.json) console.log(JSON.stringify([], null, 2));
      else console.log(chalk.yellow('⚠ No trends found.'));
      return;
    }

    const limit = parseInt(options.limit, 10);
    const slicedTrends = trends.slice(0, limit);

    if (options.json) {
      console.log(JSON.stringify(slicedTrends, null, 2));
    } else {
      console.log(`\n${chalk.blue.bold('🔥 X Trends')} for ${chalk.green((countrySlug || 'Worldwide').toUpperCase())}`);
      console.log(chalk.gray('--------------------------------------------------'));
      console.log(chalk.gray(`Rank  ${'Trend'.padEnd(30)} ${'Volume'.padStart(15)}`));
      console.log(chalk.gray('--------------------------------------------------'));

      slicedTrends.forEach((t) => {
        const rank = t.rank.toString().padStart(2, ' ');
        const name = t.name.length > 28 ? t.name.substring(0, 27) + '…' : t.name.padEnd(30);
        const volume = t.volume === 'N/A' ? chalk.gray(t.volume) : chalk.cyan(t.volume);
        
        console.log(`${chalk.gray(rank + '.')} ${chalk.white.bold(name)} ${volume.padStart(15)}`);
      });
      console.log('');
    }

  } catch (error) {
    if (spinner) spinner.fail('Error');
    if (options.json) {
      console.error(JSON.stringify({ error: error.message }));
    } else {
      console.error(chalk.red(error.message));
    }
  }
};

run();
