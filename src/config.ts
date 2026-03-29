export const config = {
  geo: {
    countryName: "Germany",
    polygonPath: "src/data/germany-coordinates.json",
    allowedCountryNames: ["Germany", "Deutschland"],
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
  map: {
    zoom: 9,
    viewport: {
      width: 1280,
      height: 900,
    },
    googleMapsBaseUrl: "https://www.google.de/maps",
  },
  scraping: {
    /**
     * When true: if no external (non-Google) website is found among card links, keep the use the last anchor (typically a Google Maps URL) as `website`.
     * When false: set `website` to null when only Google-owned links exist.
     */
    allowGoogleWebsiteFallback: true,
  },
  traversal: {
    maxRows: 50,
  },
  movement: {
    horizontalStepCount: 2,
    verticalStepCount: 2,
    horizontalStepSleepMs: 1200,
    verticalStepSleepMs: 900,
  },
  search: {
    // query: "Werkzeugverleih"          // wypożyczalnia narzędzi
    // query: "Baumaschinen mieten"      // wynajem maszyn budowlanych
    // query: "Werkzeuge mieten"         // wynajem narzędzi
    // query: "Geräteverleih"            // wypożyczalnia sprzętu
    // query: "Baugeräteverleih"         // wypożyczalnia sprzętu budowlanego
    // query: "Elektrowerkzeug Verleih"  // wypożyczalnia elektronarzędzi
    query: "Baumaschinenverleih",
    resultsSettleMs: 2500,
  },
  output: {
    seedsJsonPath: "output/results-seeds.json",
  },
  language: "de-DE",
  selectors: {
    search: {
      searchThisAreaButton: 'button[jsaction*="search.refresh"]',
    },
    sidebar: {
      /** Tried in order until a visible, sufficiently large feed is found. */
      feed: [
        'div[role="feed"]',
        '.m6QErb[aria-label]',
        '[role="main"] [role="feed"]',
        "div.m6QErb.DxyBCb",
      ],
      article: '[role="article"]',
    },
    card: {
      websiteLinks: "a[href]",
      primaryPlaceLink: 'a[href*="/maps/place/"], a[href*="/place/"]',
      title: ".fontHeadlineSmall",
      categoryBlock: ".W4Efsd.W4Efsd",
      categorySecondBlockInner: "span:first-child span:first-child",
      address:
        ".W4Efsd > .W4Efsd > span:last-child > span:last-child",
      phone: ".UsdlK",
    },
  },
} as const;
