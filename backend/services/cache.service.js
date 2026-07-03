const logger = require("../config/logger");

class CacheService {
  constructor() {
    this.cache = new Map();
    logger.info("Cache Service: In-memory store initialized.");
  }

  /**
   * Store item in cache with TTL duration (in seconds)
   */
  set(key, value, durationSeconds = 600) {
    const expiresAt = Date.now() + durationSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieve item if it exists and has not expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      logger.info(`Cache Service: MISS [Key: ${key}]`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      logger.info(`Cache Service: EXPIRED [Key: ${key}]`);
      this.cache.delete(key);
      return null;
    }

    logger.info(`Cache Service: HIT [Key: ${key}]`);
    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    logger.info("Cache Service: Flushed all keys.");
  }
}

module.exports = new CacheService();
