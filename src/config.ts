export const config = {
  geo: {
    countryName: "Poland",
    polygonPath: "src/data/poland-coordinates.json",
    allowedCountryNames: ["Poland", "Polska"],
    blockedCountryNames: [
      "Germany",
      "Deutschland",
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
    horizontalStepCount: 1,
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
    // query: "Baumaschinenverleih",
    query: "Sanatorium",
    resultsSettleMs: 2500,
  },
  output: {
    seedsJsonPath: "output/results-seeds.json",
    detailsJsonPath: "output/results-final.json",
  },
} as const;
