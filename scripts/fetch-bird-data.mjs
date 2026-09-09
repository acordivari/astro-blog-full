#!/usr/bin/env node
/**
 * Bake the default birds-of-prey locations into static JSON.
 *
 *   npm run birds:refresh
 *
 * The two default maps on /birds/ always show the same places, so there is no
 * reason to discover them in the visitor's browser: doing so cost ~24 slow GBIF
 * requests before anything could paint. The generated files are COMMITTED, so a
 * build never depends on GBIF being up and a failed refresh simply leaves the
 * previous data in place. Re-run this when you want fresher counts.
 *
 * Add a location by adding it here and pointing a <BirdsOfPreyMap seed> at the
 * matching file in src/pages/birds.astro.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchLocationData, enrichVernacularNames } from '../src/lib/gbif.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'data', 'birds');

const LOCATIONS = [
  { slug: 'san-francisco-ca', place: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, radiusMiles: 100 },
  { slug: 'boulder-co', place: 'Boulder, CO', lat: 40.015, lng: -105.2705, radiusMiles: 100 },
];

// Generous here because it runs once, offline from any visitor: more sample pages
// means denser dots on the default view than a live search would fetch.
const SAMPLE_PAGES = 2;

async function refresh(loc) {
  process.stdout.write(`\n${loc.place}\n  fetching…`);
  const payload = await fetchLocationData({
    ...loc,
    samplePages: SAMPLE_PAGES,
    concurrency: 3,
    onProgress: (done, total) => process.stdout.write(`\r  fetching… ${done}/${total} queries`),
  });

  process.stdout.write(`\r  ${payload.species.length} species, ${payload.occurrences.length} sampled dots\n`);
  process.stdout.write('  resolving common names…');
  await enrichVernacularNames(payload.species, { concurrency: 5 });

  const named = payload.species.filter((s) => s.vernacular).length;
  process.stdout.write(`\r  resolved ${named}/${payload.species.length} common names   \n`);

  const file = join(OUT_DIR, `${loc.slug}.json`);
  const json = JSON.stringify(payload);
  await writeFile(file, json);

  const total = payload.species.reduce((a, s) => a + s.count, 0);
  console.log(`  wrote public/data/birds/${loc.slug}.json (${(json.length / 1024).toFixed(0)} KB, ${total.toLocaleString()} sightings)`);
  return { ...loc, ok: true };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const failures = [];

  for (const loc of LOCATIONS) {
    try {
      await refresh(loc);
    } catch (err) {
      failures.push(loc);
      console.error(`\n  ✗ ${loc.place}: ${err.message}`);
      // Keeping the committed file is the whole point — never write a partial one.
      try {
        await readFile(join(OUT_DIR, `${loc.slug}.json`));
        console.error('    existing data left untouched.');
      } catch {
        console.error('    NO existing data for this location — the map will fall back to a live fetch.');
      }
    }
  }

  if (failures.length === LOCATIONS.length) {
    console.error('\nAll locations failed. GBIF may be rate-limiting; try again shortly.');
    process.exit(1);
  }
  console.log('\nDone.');
}

main();
