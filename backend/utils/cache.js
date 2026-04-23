const NodeCache = require('node-cache');
const logger = require('./logger');

// Default TTL: 5 minutes (300 seconds), check for expired keys every 60s
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Get a cached value by key.
 * @param {string} key
 * @returns {*} cached value or undefined
 */
const get = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
  }
  return value;
};

/**
 * Set a value in cache.
 * @param {string} key
 * @param {*} value
 * @param {number} [ttl] - Optional TTL override in seconds
 */
const set = (key, value, ttl) => {
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
  logger.debug(`Cache SET: ${key}`);
};

/**
 * Delete a specific cache key.
 * @param {string} key
 */
const invalidate = (key) => {
  cache.del(key);
  logger.debug(`Cache INVALIDATED: ${key}`);
};

/**
 * Invalidate all keys matching a prefix pattern.
 * Useful for invalidating all analytics for a workspace when tasks change.
 * @param {string} prefix - e.g. "analytics:" or "dashboard:ws:abc123"
 */
const invalidateByPrefix = (prefix) => {
  const keys = cache.keys().filter(k => k.startsWith(prefix));
  if (keys.length > 0) {
    cache.del(keys);
    logger.debug(`Cache INVALIDATED ${keys.length} keys with prefix: ${prefix}`);
  }
};

/**
 * Invalidate all cache keys related to a specific workspace.
 * Called after task create/update/delete/assign.
 * @param {string} workspaceId
 */
const invalidateWorkspaceCache = (workspaceId) => {
  if (!workspaceId) return;
  const wsId = workspaceId.toString();
  invalidateByPrefix(`dashboard:ws:${wsId}`);
  invalidateByPrefix(`analytics:`);
  invalidateByPrefix(`profile:`);
};

/**
 * Get cache stats for monitoring.
 */
const getStats = () => cache.getStats();

module.exports = {
  get,
  set,
  invalidate,
  invalidateByPrefix,
  invalidateWorkspaceCache,
  getStats,
};
