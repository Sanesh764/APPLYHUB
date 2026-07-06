const logger = require("../../config/logger");

/**
 * -----------------------------------------------------------------------------
 * BaseJobProvider
 * -----------------------------------------------------------------------------
 * Contract every job-source adapter implements. A provider is a thin, isolated
 * translator between one public job API and ApplyHub's normalized "raw job"
 * shape. The aggregator (services/jobAggregator.service.js) owns fan-out,
 * de-duplication, enrichment and ranking — providers stay dumb and stateless.
 *
 * To add a new source: create `<name>.provider.js` extending this class,
 * implement `searchJobs()`, and register it in `providers/index.js`. Nothing
 * else in the pipeline needs to change.
 *
 * Normalized raw job shape returned by every provider:
 * {
 *   externalId, source, title, company, logo, location,
 *   workMode ("remote"|"hybrid"|"onsite"|""), salaryRaw, currency,
 *   employmentType, description, applyUrl, postedAt (Date), tags: []
 * }
 */
class BaseJobProvider {
  /**
   * @param {string} name  Stable machine name used as the `source` field.
   */
  constructor(name) {
    this.name = name;
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    };
  }

  /**
   * Whether this provider is usable given current env configuration.
   * Providers requiring keys/board lists override this. Default: always on.
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Search jobs from the underlying source. MUST be overridden.
   * Implementations should never throw — return [] on any failure so one bad
   * provider can never break the aggregate. The aggregator also wraps calls
   * defensively, but keeping providers self-contained keeps logs clean.
   *
   * @param {string} query               Free-text keyword (may be empty).
   * @param {Object} filters             Normalized filters from the controller.
   * @returns {Promise<Array<Object>>}   Array of normalized raw jobs.
   */
  async searchJobs(query, filters = {}) {
    return [];
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  /**
   * Fetch JSON with a hard timeout and browser-like headers. Returns null on
   * any non-2xx or network/timeout error (logged as a warning, not thrown).
   * @param {string} url
   * @param {Object} [options]
   * @param {number} [options.timeout=6000]
   * @returns {Promise<any|null>}
   */
  async fetchJSON(url, { timeout = 6000, headers = {} } = {}) {
    try {
      const response = await fetch(url, {
        headers: { ...this.headers, ...headers },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) {
        logger.warn(`Provider[${this.name}]: HTTP ${response.status} for ${url}`);
        return null;
      }
      return await response.json();
    } catch (err) {
      logger.warn(`Provider[${this.name}]: request failed for ${url} — ${err.message}`);
      return null;
    }
  }

  /**
   * Strip HTML tags and collapse whitespace from a description blob.
   * @param {string} str
   * @returns {string}
   */
  cleanHTML(str) {
    if (!str) return "";
    return str
      .replace(/<\/?[^>]+(>|$)/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Infer a work mode from free text. Returns "" when undetermined so the
   * enrichment layer can decide the final value.
   * @param {string} text
   * @returns {"remote"|"hybrid"|"onsite"|""}
   */
  normalizeWorkMode(text) {
    const t = (text || "").toLowerCase();
    if (!t) return "";
    if (/\bhybrid\b/.test(t)) return "hybrid";
    if (/\b(remote|work from home|wfh|distributed)\b/.test(t)) return "remote";
    if (/\b(on-?site|in-?office|in person)\b/.test(t)) return "onsite";
    return "";
  }

  /**
   * Split a composite "City, State, Country" location string into parts.
   * Best-effort only; blanks are fine — location is a soft signal.
   * @param {string} locationText
   * @returns {{location:string, city:string, state:string, country:string}}
   */
  parseLocation(locationText) {
    const location = (locationText || "").toString().trim();
    const parts = location
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    let city = "";
    let state = "";
    let country = "";

    if (parts.length >= 3) {
      [city, state] = parts;
      country = parts[parts.length - 1];
    } else if (parts.length === 2) {
      [city, state] = parts;
    } else if (parts.length === 1) {
      city = parts[0];
    }

    // Common normalization
    if (city.toLowerCase() === "bangalore") city = "Bengaluru";

    return { location, city, state, country };
  }

  /**
   * Coerce any value into a Date, falling back to now for unparseable input.
   * @param {*} value
   * @returns {Date}
   */
  toDate(value) {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }
}

module.exports = BaseJobProvider;
