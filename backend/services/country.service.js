const logger = require("../config/logger");

const COUNTRY_MAP = {
  "india": {
    code: "in",
    currency: "INR",
    tokens: ["india", "indian", "bharat", " in ", "(in)"],
    cities: [
      "bangalore", "bengaluru", "hyderabad", "pune", "chennai", "mumbai", "delhi", "delhi ncr",
      "new delhi", "noida", "gurugram", "gurgaon", "kolkata", "ahmedabad", "kochi", "cochin",
      "jaipur", "bhubaneswar", "indore", "chandigarh", "lucknow", "patna", "visakhapatnam",
      "vizag", "nagpur", "surat", "coimbatore", "thiruvananthapuram", "trivandrum", "mysore", "mysuru"
    ],
    states: [
      "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat",
      "haryana", "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh",
      "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab", "rajasthan",
      "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
      "jammu and kashmir", "ladakh", "puducherry", "pondicherry"
    ],
    eligibleTokens: [
      "india", "worldwide", "world wide", "anywhere", "global", "remote (india)", "remote india",
      "asia", "apac", "emea"
    ]
  },
  "united states": {
    code: "us",
    currency: "USD",
    tokens: ["united states", "usa", "us", "u.s.a.", " u.s. ", "(us)", "(usa)"],
    cities: [
      "new york", "los angeles", "chicago", "houston", "phoenix", "philadelphia", "san antonio",
      "san diego", "dallas", "san jose", "austin", "jacksonville", "san francisco", "columbus",
      "fort worth", "indianapolis", "charlotte", "seattle", "denver", "el paso", "boston",
      "detroit", "nashville", "portland", "memphis", "oklahoma city", "las vegas", "baltimore"
    ],
    states: [
      "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware",
      "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky",
      "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
      "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey", "new mexico",
      "new york", "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania",
      "rhode island", "south carolina", "south dakota", "tennessee", "texas", "utah", "vermont",
      "virginia", "washington", "west virginia", "wisconsin", "wyoming"
    ],
    eligibleTokens: ["united states", "usa", "us", "worldwide", "world wide", "anywhere", "global"]
  },
  "united kingdom": {
    code: "gb",
    currency: "GBP",
    tokens: ["united kingdom", "uk", "gb", "great britain", " u.k. ", "(uk)", "(gb)"],
    cities: [
      "london", "birmingham", "leeds", "glasgow", "sheffield", "manchester", "edinburgh", "liverpool",
      "bristol", "cardiff", "belfast", "leicester", "nottingham", "newcastle", "southampton"
    ],
    states: ["england", "scotland", "wales", "northern ireland"],
    eligibleTokens: ["united kingdom", "uk", "gb", "worldwide", "world wide", "anywhere", "global", "europe", "emea"]
  }
};

const FOREIGN_RESTRICTION_TOKENS = [
  "must be located in",
  "must reside in",
  "us only",
  "u.s. only",
  "usa only",
  "eu only",
  "uk only",
  "canada only",
  "authorized to work in the us",
  "authorized to work in the united states",
  "work authorization in the",
  "us citizens only",
  "eu citizens only",
  "based in the us",
  "based in the united states",
  "onsite in",
];

const SPONSORSHIP_TOKENS = [
  "visa sponsorship",
  "sponsor a visa",
  "we sponsor",
  "sponsorship available",
  "relocation provided",
  "relocation assistance",
  "international applicants",
  "open to international",
];

const COUNTRY_ISO_MAP = {
  in: "in", india: "in",
  us: "us", usa: "us", "united states": "us",
  gb: "gb", uk: "gb", "united kingdom": "gb",
  ca: "ca", canada: "ca",
  au: "au", australia: "au",
  de: "de", germany: "de",
  fr: "fr", france: "fr",
  nl: "nl", netherlands: "nl",
  sg: "sg", singapore: "sg",
};

class CountryService {
  getCountryData(countryName) {
    const key = (countryName || "India").toLowerCase().trim();
    if (COUNTRY_MAP[key]) {
      return COUNTRY_MAP[key];
    }
    
    // Guess code from ISO map
    const code = COUNTRY_ISO_MAP[key] || key.substring(0, 2);
    // Dynamic fallback for unconfigured countries
    return {
      code,
      currency: code === "in" ? "INR" : code === "gb" ? "GBP" : "USD",
      tokens: [key],
      cities: [],
      states: [],
      eligibleTokens: [key, "worldwide", "world wide", "anywhere", "global"]
    };
  }

  isCountryLocation(location, countryName) {
    const loc = (location || "").toLowerCase().trim();
    if (!loc) return false;
    
    const data = this.getCountryData(countryName);
    
    // Check tokens
    if (data.tokens.some(t => loc.includes(t))) return true;
    // Check cities
    if (data.cities.some(c => loc.includes(c))) return true;
    // Check states
    if (data.states.some(s => loc.includes(s))) return true;
    
    return false;
  }

  isRemoteLocation(location) {
    return (location || "").toLowerCase().includes("remote");
  }

  allowsCountryApplicants(job, countryName) {
    const location = (job.location || "").toLowerCase();
    const title = (job.title || "").toLowerCase();
    const desc = (job.description || "").toLowerCase();
    const haystack = `${title} ${location} ${desc}`;
    
    const data = this.getCountryData(countryName);

    if (this.isCountryLocation(location, countryName)) return true;
    if (SPONSORSHIP_TOKENS.some(t => haystack.includes(t))) return true;

    const remote = job.remoteType === "remote" || this.isRemoteLocation(location);
    if (remote) {
      if (FOREIGN_RESTRICTION_TOKENS.some(t => haystack.includes(t))) {
        return data.eligibleTokens.some(t => haystack.includes(t));
      }
      return true;
    }

    // Onsite in a foreign location: reject unless there's sponsorship
    return data.eligibleTokens.some(t => haystack.includes(t)) && !this.isForeignOnsite(location, countryName);
  }

  isForeignOnsite(location, countryName) {
    const loc = (location || "").toLowerCase().trim();
    if (!loc || loc.includes("remote")) return false;
    return !this.isCountryLocation(loc, countryName);
  }

  countryTier(job, countryName) {
    const inCountry = this.isCountryLocation(job.location, countryName);
    const remote = job.remoteType === "remote" || this.isRemoteLocation(job.location);
    
    if (inCountry && !remote) return 0; // Onsite/hybrid in country
    if (inCountry && remote) return 1;  // Remote in country
    if (remote) return 2;               // Global remote open to country
    return 3;                           // Other
  }
}

module.exports = new CountryService();
