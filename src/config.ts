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
    googleMapsBaseUrl: "https://www.google.com/maps",
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
    // Control that reapplies the search after the map moves
    searchThisAreaButtonSelector: 'button[jsaction*="search.refresh"]',
  },
  output: {
    seedsJsonPath: "output/results-seeds.json",
    detailsJsonPath: "output/results-final.json",
  },
} as const;
