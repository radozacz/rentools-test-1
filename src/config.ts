/**
 * Central configuration for the map scraper (URLs, traversal, DOM selectors, output).
 * Behavior is driven only from here — change values here rather than hardcoding in utilities.
 */

export const config = {
  // ---------------------------------------------------------------------------
  // Geo — country polygon for map traversal and per-result coordinate checks
  // ---------------------------------------------------------------------------
  geo: {
    /** GeoJSON path; loaded in `src/scripts/search.ts` and used when filtering scraped seeds. */
    polygonPath: "src/data/germany-coordinates.json",
    /** When coordinates are missing, an address containing one of these (substring, case-insensitive) counts as in-country. */
    allowedCountryNames: ["Germany", "Deutschland"],
    /** Substrings in the address that reject a seed (case-insensitive), as a safety layer near borders. */
    blockedCountryNames: [
      "Poland",
      "Polska",
      "Czechia",
      "Czech Republic",
      "Czechy",
      "Austria",
      "Österreich",
      "Netherlands",
      "Belgium",
      "France",
      "Switzerland",
      "Luxembourg",
      "Denmark",
    ],
  },

  // ---------------------------------------------------------------------------
  // Map — Google Maps URL, zoom, and Playwright viewport
  // ---------------------------------------------------------------------------
  map: {
    /** Default map zoom level passed to `buildMapUrl` in `src/utils/map.ts` / `src/scripts/search.ts`. */
    zoom: 9,
    /** Browser window size for Playwright (`search.ts` launch options). */
    viewport: {
      /** Window width in pixels. */
      width: 1280,
      /** Window height in pixels. */
      height: 900,
    },
    /**
     * Base Google Maps URL (locale-specific host). Used for opening Maps, building search URLs,
     * and resolving relative `/maps/...` links in `src/utils/map.ts` and `src/utils/scraper.ts`.
     */
    googleMapsBaseUrl: "https://www.google.de/maps",
  },

  // ---------------------------------------------------------------------------
  // Language — browser / Maps locale
  // ---------------------------------------------------------------------------
  /** BCP 47 locale passed to Playwright context (`locale` in `src/scripts/search.ts`). */
  language: "de-DE",

  // ---------------------------------------------------------------------------
  // Search — default query and post-action delays
  // ---------------------------------------------------------------------------
  search: {
    // query: "Werkzeugverleih"          // wypożyczalnia narzędzi
    // query: "Baumaschinen mieten"      // wynajem maszyn budowlanych
    // query: "Werkzeuge mieten"         // wynajem narzędzi
    // query: "Geräteverleih"            // wypożyczalnia sprzętu
    // query: "Baugeräteverleih"         // wypożyczalnia sprzętu budowlanego
    // query: "Elektrowerkzeug Verleih"  // wypożyczalnia elektronarzędzi
    /** Search string embedded in the Maps URL (`buildMapUrl` in `src/utils/map.ts`). */
    query: "Baumaschinenverleih",
    /** Milliseconds to wait after search UI actions (e.g. “Search this area”) so results settle (`src/utils/scraper.ts`). */
    resultsSettleMs: 2500,
  },

  // ---------------------------------------------------------------------------
  // Movement — keyboard panning between grid cells (`src/utils/traversal.ts`)
  // ---------------------------------------------------------------------------
  movement: {
    /** How many arrow-key steps per horizontal move to the next column. */
    horizontalStepCount: 2,
    /** How many arrow-key steps per vertical move to the next row. */
    verticalStepCount: 2,
    /** Pause (ms) after each horizontal arrow press. */
    horizontalStepSleepMs: 1200,
    /** Pause (ms) after each vertical arrow press. */
    verticalStepSleepMs: 900,
  },

  // ---------------------------------------------------------------------------
  // Traversal — outer loop over map grid rows (`src/scripts/search.ts`)
  // ---------------------------------------------------------------------------
  traversal: {
    /** Maximum row index to traverse before stopping the run. */
    maxRows: 50,
  },

  // ---------------------------------------------------------------------------
  // Scraping — how extracted fields are interpreted (`src/utils/scraper.ts`)
  // ---------------------------------------------------------------------------
  scraping: {
    /**
     * When true: if every `a[href]` on a result card points at Google-owned URLs, fall back to the
     * last link (usually Maps) as `website`. When false: set `website` to null in that case.
     */
    allowGoogleWebsiteFallback: true,
  },

  // ---------------------------------------------------------------------------
  // Output — persisted seed file
  // ---------------------------------------------------------------------------
  output: {
    /** JSON path written by incremental collectors and the main search script (`traversal.ts`, `scrollResults.ts`, `search.ts`). */
    seedsJsonPath: "output/results-seeds.json",
  },

  // ---------------------------------------------------------------------------
  // Selectors — DOM queries for Google Maps UI (`src/utils/scraper.ts`)
  // ---------------------------------------------------------------------------
  selectors: {
    search: {
      /** “Search this area” refresh control after panning the map. */
      searchThisAreaButton: 'button[jsaction*="search.refresh"]',
    },
    sidebar: {
      /**
       * Candidate selectors for the scrollable results list; tried in order until one is visible
       * and large enough to be treated as the feed (`getResultsFeed`).
       */
      feed: [
        'div[role="feed"]',
        '.m6QErb[aria-label]',
        '[role="main"] [role="feed"]',
        "div.m6QErb.DxyBCb",
      ],
      /** Each business row in the sidebar (`collectVisibleSeeds` iterates these). */
      article: '[role="article"]',
    },
    card: {
      /** All anchors under a result card; used to collect hrefs for the website field. */
      websiteLinks: "a[href]",
      /** Preferred link to the place detail / Maps entity (place id, coords in URL). */
      primaryPlaceLink: 'a[href*="/maps/place/"], a[href*="/place/"]',
      /** Business name line. */
      title: ".fontHeadlineSmall",
      /** Repeated text blocks; category is read from the second block. */
      categoryBlock: ".W4Efsd.W4Efsd",
      /** Inner spans for category text inside the second `.W4Efsd` block. */
      categorySecondBlockInner: "span:first-child span:first-child",
      /** Address line (nested span path). */
      address:
        ".W4Efsd > .W4Efsd > span:last-child > span:last-child",
      /** Phone number cell. */
      phone: ".UsdlK",
    },
  },
} as const;
