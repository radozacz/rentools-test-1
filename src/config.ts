export const config = {
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
    horizontalStepSleepMs: 1200,
    verticalStepSleepMs: 900,
    rowShiftSteps: 2,
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
    detailsJsonPath: "output/results-final.json",
  },
} as const;

