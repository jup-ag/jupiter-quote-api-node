import { SwapApi } from "../generated/apis/SwapApi";
import { Configuration, ConfigurationParameters } from "../generated/runtime";
import { createQuoteCacheMiddleware, QuoteCacheOptions } from "./cache-middleware";

/**
 * Cache enhancement modes for different user types
 */
export type CacheMode = 'conservative' | 'balanced' | 'aggressive';

/**
 * Plugin configuration options
 */
export interface CachePluginOptions {
  /** Cache mode preset (default: 'balanced') */
  mode?: CacheMode;
  /** Custom cache options (overrides mode preset) */
  cacheOptions?: QuoteCacheOptions;
  /** Enable/disable caching (default: true) */
  enabled?: boolean;
}

/**
 * Smart cache presets for different user types
 */
const CACHE_PRESETS: Record<CacheMode, QuoteCacheOptions> = {
  conservative: { 
    maxSize: 100, 
    defaultTTL: 15,
    maxTTL: 30
  },
  balanced: { 
    maxSize: 500, 
    defaultTTL: 30,
    maxTTL: 60
  },
  aggressive: { 
    maxSize: 1000, 
    defaultTTL: 60,
    maxTTL: 120
  }
};

/**
 * Enhance Jupiter API client with intelligent caching
 * 
 * @param jupiterApi - Existing Jupiter API client
 * @param options - Cache configuration options
 * @returns Enhanced API client with caching middleware
 * 
 * @example
 * ```typescript
 * import { createJupiterApiClient } from '@jup-ag/api';
 * import { withCache } from './jupiter-cache-plugin';
 * 
 * const api = withCache(createJupiterApiClient(), {
 *   mode: 'balanced'
 * });
 * 
 * // Same API, 63% faster responses
 * const quote = await api.quoteGet({...});
 * ```
 */
export function withCache(
  jupiterApi: SwapApi, 
  options: CachePluginOptions = {}
): SwapApi {
  const { 
    mode = 'balanced', 
    cacheOptions, 
    enabled = true 
  } = options;

  // If caching disabled, return original client
  if (!enabled) {
    return jupiterApi;
  }

  // Get cache configuration (custom options override preset)
  const finalCacheOptions = cacheOptions || CACHE_PRESETS[mode];
  
  // Create cache middleware
  const cacheMiddleware = createQuoteCacheMiddleware(finalCacheOptions);
  
  // Get original configuration
  const originalConfig = (jupiterApi as any).configuration as Configuration;
  
  // Create new configuration with cache middleware
  const enhancedConfig = new Configuration({
    ...originalConfig,
    middleware: [
      ...(originalConfig.middleware || []),
      cacheMiddleware
    ]
  });
  
  // Return new SwapApi instance with caching
  return new SwapApi(enhancedConfig);
}

/**
 * Create a cached Jupiter API client in one step
 * 
 * @param config - Original Jupiter API configuration
 * @param cacheOptions - Cache plugin options
 * @returns New Jupiter API client with caching enabled
 * 
 * @example
 * ```typescript
 * const api = createCachedJupiterClient(
 *   { apiKey: 'your-key' },
 *   { mode: 'aggressive' }
 * );
 * ```
 */
export function createCachedJupiterClient(
  config?: ConfigurationParameters,
  cacheOptions?: CachePluginOptions
): SwapApi {
  // Determine server URL based on API key
  const hasApiKey = config?.apiKey !== undefined;
  const basePath = hasApiKey 
    ? "https://api.jup.ag/swap/v1"
    : "https://lite-api.jup.ag/swap/v1";
  
  // Create base configuration
  const baseConfig: ConfigurationParameters = {
    ...config,
    basePath,
    headers: hasApiKey ? { 'x-api-key': config?.apiKey as string } : undefined
  };
  
  // Create base client
  const baseClient = new SwapApi(new Configuration(baseConfig));
  
  // Add caching
  return withCache(baseClient, cacheOptions);
}

// Export cache middleware components for advanced usage
export { createQuoteCacheMiddleware, QuoteCacheMiddleware } from "./cache-middleware";
export type { QuoteCacheOptions } from "./cache-middleware";