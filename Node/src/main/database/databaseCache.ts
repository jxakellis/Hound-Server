import { SERVER } from '../server/globalConstants.js';
import type { LogActionTypeRow } from '../types/rows/LogActionTypeRow.js';
import type { LogUnitTypeRow } from '../types/rows/LogUnitTypeRow.js';
import type { MappingLogActionTypeLogUnitTypeRow } from '../types/rows/MappingLogActionTypeLogUnitTypeRow.js';
import type { MappingLogActionTypeReminderActionTypeRow } from '../types/rows/MappingLogActionTypeReminderActionTypeRow.js';
import type { ReminderActionTypeRow } from '../types/rows/ReminderActionTypeRow.js';

const CACHE_KEYS = {
  LOG_ACTION_TYPES: 'LOG_ACTION_TYPES',
  REMINDER_ACTION_TYPES: 'REMINDER_ACTION_TYPES',
  MAPPING_LOG_ACTION_REMINDER_ACTION_TYPES: 'MAPPING_LOG_ACTION_REMINDER_ACTION_TYPES',
  LOG_UNIT_TYPES: 'LOG_UNIT_TYPES',
  MAPPING_LOG_ACTION_LOG_UNIT_TYPES: 'MAPPING_LOG_ACTION_LOG_UNIT_TYPES',
} as const;

type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];
interface CacheStore {
    [CACHE_KEYS.LOG_ACTION_TYPES]: LogActionTypeRow[];
    [CACHE_KEYS.REMINDER_ACTION_TYPES]: ReminderActionTypeRow[];
    [CACHE_KEYS.MAPPING_LOG_ACTION_REMINDER_ACTION_TYPES]: MappingLogActionTypeReminderActionTypeRow[];
    [CACHE_KEYS.LOG_UNIT_TYPES]: LogUnitTypeRow[];
    [CACHE_KEYS.MAPPING_LOG_ACTION_LOG_UNIT_TYPES]: MappingLogActionTypeLogUnitTypeRow[];
}
type CacheValue<K extends CacheKey> = CacheStore[K];

type CacheEntry<T> = { value: T; expiresAt: number }
// Our global cache store. K is the cache key namespace, V is the stored value type.
const cache = new Map<string, CacheEntry<unknown>>();

// Safely retrieve a cached value for `key`. Returns `CacheStore[K] | undefined`.
function getCached<K extends CacheKey>(
  key: K,
): CacheValue<K> | undefined {
  const entry = cache.get(key);
  if (entry === undefined || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  const valueCopy = structuredClone(entry.value);

  return valueCopy as CacheValue<K>;
}

// Store `value` in cache under `key` for `ttlMS`. Enforces that `value` matches the type for that key.
function setCached<K extends CacheKey>(
  key: K,
  value: CacheValue<K>,
): void {
  cache.set(key, { value, expiresAt: Date.now() + SERVER.DATABASE_TYPE_CACHE_TTL_MS });
}

function invalidateCached(key: CacheKey): void {
  cache.delete(key);
}

export {
  CACHE_KEYS,
  getCached,
  setCached,
  invalidateCached,
};
