/**
 * Shared GBIF access for the birds-of-prey maps.
 *
 * Imported by two very different callers, so it is plain ESM with no build step
 * and no dependencies: `scripts/fetch-bird-data.mjs` runs it in Node to bake the
 * default locations into static JSON, and BirdsOfPreyMap.astro runs it in the
 * browser when a visitor searches their own address.
 *
 * The key design point is that statistics and map dots come from *different*
 * queries. Counting by downloading every record meant ~7,200 records across 24
 * paged requests before the page could show anything, and GBIF's deep pagination
 * gets slower the further you page. A facet query returns exact totals for the
 * whole dataset in a single request, so the dots only need a small sample.
 */

/** GBIF backbone taxon keys for the three raptor orders.
 *
 * These are versioned by GBIF and the pre-2025 keys have since moved: 7191
 * (Falcons) now matches nothing and 1458 resolves to Orthoptera. Re-resolve via
 * https://api.gbif.org/v1/species/match?rank=ORDER&kingdom=Animalia&name=<Order>
 * if falcons or owls ever disappear again. */
export const RAPTOR_ORDERS = [
  { taxonKey: 7191147, order: 'Accipitriformes' },
  { taxonKey: 7191407, order: 'Falconiformes' },
  { taxonKey: 1450, order: 'Strigiformes' },
];

export const PAYLOAD_VERSION = 2;

const API = 'https://api.gbif.org/v1';
const YEARS_BACK = 5;

/** Records per sample page. GBIF's own maximum for this endpoint is 300. */
const PAGE_SIZE = 300;

/** Species whose names we will resolve individually. Locations run ~30 species;
 *  the cap only exists so a pathological area cannot fan out unbounded. */
const MAX_SPECIES_LOOKUPS = 80;

function yearRange() {
  const now = new Date().getFullYear();
  return `${now - YEARS_BACK},${now}`;
}

function areaQuery(lat, lng, radiusMiles) {
  return {
    geoDistance: `${lat},${lng},${radiusMiles}mi`,
    hasCoordinate: 'true',
    hasGeospatialIssue: 'false',
    year: yearRange(),
  };
}

/**
 * Fetch JSON with retry + backoff. GBIF returns 429 under bursts and 5xx when
 * busy; a short exponential backoff (honoring Retry-After) recovers cleanly.
 */
export async function fetchJson(url, tries = 4, timeoutMs = 30000) {
  let delay = 600;
  for (let attempt = 0; attempt < tries; attempt++) {
    let res;
    try {
      // Bounded per attempt: GBIF occasionally accepts a connection and then
      // never answers, and without this the caller waits forever.
      res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      // Network-level failure (offline, DNS, aborted connection).
      if (attempt === tries - 1) throw err;
      await sleep(delay);
      delay *= 2;
      continue;
    }
    if (res.ok) return res.json();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === tries - 1) {
      throw new Error(`GBIF API error: ${res.status}`);
    }
    const retryAfter = parseInt(res.headers.get('retry-after') || '', 10);
    await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : delay);
    delay *= 2;
  }
  throw new Error('GBIF API: exhausted retries');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run `worker` over `items` with at most `limit` in flight at once. */
export async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * Exact species counts for one order, over the entire matching dataset.
 * `limit=0` means no records are transferred — just the facet.
 */
async function fetchOrderFacet({ taxonKey }, lat, lng, radiusMiles) {
  const params = new URLSearchParams({
    ...areaQuery(lat, lng, radiusMiles),
    taxonKey: String(taxonKey),
    limit: '0',
    facet: 'speciesKey',
    facetLimit: '300',
  });
  const data = await fetchJson(`${API}/occurrence/search?${params}`);
  const counts = data.facets?.[0]?.counts ?? [];
  return counts
    .map((c) => ({ key: Number(c.name), count: c.count }))
    .filter((c) => Number.isFinite(c.key));
}

/** A bounded sample of real records, used only to draw dots and seasonality. */
async function fetchOrderSample({ taxonKey }, lat, lng, radiusMiles, pages) {
  const records = [];
  for (let page = 0; page < pages; page++) {
    const params = new URLSearchParams({
      ...areaQuery(lat, lng, radiusMiles),
      taxonKey: String(taxonKey),
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    const data = await fetchJson(`${API}/occurrence/search?${params}`);
    records.push(...(data.results ?? []));
    if (data.endOfRecords || data.results.length < PAGE_SIZE) break;
  }
  return records;
}

/** Resolve a speciesKey we did not see in the sample to its names. */
async function fetchSpecies(key) {
  try {
    const d = await fetchJson(`${API}/species/${key}`, 2);
    return {
      name: d.canonicalName || d.species || d.scientificName || '',
      order: d.order || '',
      family: d.family || '',
    };
  } catch {
    return null;
  }
}

/**
 * Everything the map needs for one location.
 *
 * Statistics come from facets (exact, whole-dataset). Dots come from `samplePages`
 * pages per order. Vernacular names are deliberately NOT fetched here — they are
 * slow and the page should paint without them; see enrichVernacularNames.
 *
 * @returns {Promise<object>} a payload matching the shape written to public/data.
 */
export async function fetchLocationData({
  lat,
  lng,
  radiusMiles,
  place = '',
  samplePages = 1,
  concurrency = 4,
  onProgress = () => {},
}) {
  // Facets and samples for all three orders go out together — six small requests
  // instead of the twenty-four paged ones this replaces.
  const tasks = [];
  for (const order of RAPTOR_ORDERS) {
    tasks.push({ kind: 'facet', order });
    tasks.push({ kind: 'sample', order });
  }

  let done = 0;
  const results = await pool(tasks, concurrency, async (task) => {
    const value =
      task.kind === 'facet'
        ? await fetchOrderFacet(task.order, lat, lng, radiusMiles)
        : await fetchOrderSample(task.order, lat, lng, radiusMiles, samplePages);
    onProgress(++done, tasks.length);
    return { ...task, value };
  });

  // Names, order and family for whatever the sample happened to include.
  /** @type {Map<number, {name: string, order: string, family: string}>} */
  const known = new Map();
  const occurrences = [];
  for (const r of results) {
    if (r.kind !== 'sample') continue;
    for (const occ of r.value) {
      const key = occ.speciesKey;
      const name = occ.species || occ.genericName;
      if (!key || !name) continue;
      if (occ.order !== r.order.order) continue; // defensive: keep the order pure
      if (!known.has(key)) {
        known.set(key, { name, order: occ.order, family: occ.family || 'Unknown' });
      }
      if (occ.decimalLatitude == null || occ.decimalLongitude == null) continue;
      occurrences.push({
        y: round(occ.decimalLatitude),
        x: round(occ.decimalLongitude),
        k: key,
        d: occ.eventDate ? String(occ.eventDate).slice(0, 10) : '',
        s: occ.stateProvince || '',
      });
    }
  }

  // Facet counts are the authoritative numbers.
  /** @type {Map<number, {key: number, count: number, order: string}>} */
  const tally = new Map();
  for (const r of results) {
    if (r.kind !== 'facet') continue;
    for (const { key, count } of r.value) {
      tally.set(key, { key, count, order: r.order.order });
    }
  }

  // Anything counted but absent from the sample is a rarer species — look it up.
  const unresolved = [...tally.values()]
    .filter((s) => !known.has(s.key))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_SPECIES_LOOKUPS);

  await pool(unresolved, Math.max(concurrency, 8), async (s) => {
    const info = await fetchSpecies(s.key);
    if (info?.name) {
      known.set(s.key, { name: info.name, order: info.order || s.order, family: info.family || 'Unknown' });
    }
  });

  const species = [...tally.values()]
    .map((s) => {
      const info = known.get(s.key);
      if (!info) return null;
      return {
        key: s.key,
        name: info.name,
        vernacular: '',
        order: info.order || s.order,
        family: info.family || 'Unknown',
        count: s.count,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);

  // Drop sampled dots whose species never resolved, so every dot can be clicked
  // through to a species that exists in the grid.
  const speciesKeys = new Set(species.map((s) => s.key));

  return {
    version: PAYLOAD_VERSION,
    fetchedAt: new Date().toISOString(),
    place,
    lat,
    lng,
    radiusMiles,
    species,
    occurrences: occurrences.filter((o) => speciesKeys.has(o.k)),
  };
}

const round = (n) => Math.round(n * 1e4) / 1e4;

/**
 * Fill in English common names, mutating `species` in place.
 *
 * Three sources because no single one is reliable for raptors: Wikipedia article
 * titles are usually the common name, iNaturalist covers what Wikipedia redirects
 * oddly, and GBIF's vernacularNames is the backstop. This is the slow part of the
 * whole pipeline, which is why callers run it *after* painting.
 */
export async function enrichVernacularNames(species, { concurrency = 6, onName = () => {} } = {}) {
  const pending = species.filter((s) => !s.vernacular);
  const looksEnglish = (s) => !!s && /^[A-Za-z\s\-']+$/.test(s);

  await pool(pending, concurrency, async (sp) => {
    try {
      const wikiTitle = encodeURIComponent(sp.name.replace(/ /g, '_'));
      const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`);
      if (wiki.ok) {
        const data = await wiki.json();
        const title = data.title;
        if (title && title.toLowerCase() !== sp.name.toLowerCase() && looksEnglish(title)) {
          sp.vernacular = title;
          onName(sp);
          return;
        }
      }

      const inat = await fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sp.name)}&rank=species&per_page=1&locale=en`
      );
      if (inat.ok) {
        const data = await inat.json();
        const taxon = data.results?.[0];
        const common = taxon?.english_common_name || taxon?.preferred_common_name;
        if (looksEnglish(common)) {
          sp.vernacular = common;
          onName(sp);
          return;
        }
      }

      const gbif = await fetch(`${API}/species/${sp.key}/vernacularNames?limit=20`);
      if (gbif.ok) {
        const data = await gbif.json();
        const eng = data.results?.find(
          (n) => (n.language === 'eng' || n.language === 'en') && looksEnglish(n.vernacularName)
        );
        if (eng?.vernacularName) {
          sp.vernacular = eng.vernacularName;
          onName(sp);
        }
      }
    } catch {
      // A missing common name is cosmetic — the scientific name still renders.
    }
  });

  return species;
}

/** Geocode an address / place name via Nominatim (OpenStreetMap). No API key. */
export async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
}
