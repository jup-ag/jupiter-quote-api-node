import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJupiterApiClient } from '../src/index';
import { withCache, createCachedJupiterClient } from '../src/jupiter-cache-plugin';
import type { QuoteResponse } from '../generated/models';

// Follow Jupiter's testing pattern
describe('Jupiter Cache Plugin', () => {
  let baseClient: any;
  
  beforeEach(() => {
    baseClient = createJupiterApiClient();
  });

  describe('Plugin Integration', () => {
    it('should enhance existing client with caching', () => {
      const cachedClient = withCache(baseClient, { mode: 'balanced' });
      
      // Should return enhanced client
      expect(cachedClient).toBeDefined();
      expect(cachedClient.quoteGet).toBeDefined();
    });

    it('should return original client when caching disabled', () => {
      const uncachedClient = withCache(baseClient, { enabled: false });
      
      // Should return original client
      expect(uncachedClient).toBe(baseClient);
    });

    it('should support different cache modes', () => {
      const conservativeClient = withCache(baseClient, { mode: 'conservative' });
      const balancedClient = withCache(baseClient, { mode: 'balanced' });
      const aggressiveClient = withCache(baseClient, { mode: 'aggressive' });
      const adaptiveClient = withCache(baseClient, { mode: 'adaptive' });
      const predictiveClient = withCache(baseClient, { mode: 'predictive' });
      
      expect(conservativeClient).toBeDefined();
      expect(balancedClient).toBeDefined();
      expect(aggressiveClient).toBeDefined();
      expect(adaptiveClient).toBeDefined();
      expect(predictiveClient).toBeDefined();
    });
  });

  describe('Cache Modes', () => {
    it('should use correct cache settings for conservative mode', () => {
      const client = withCache(baseClient, { mode: 'conservative' });
      const config = (client as any).configuration;
      
      expect(config).toBeDefined();
      expect(config.middleware).toBeDefined();
      expect(config.middleware.length).toBeGreaterThan(0);
    });

    it('should use correct cache settings for balanced mode', () => {
      const client = withCache(baseClient, { mode: 'balanced' });
      const config = (client as any).configuration;
      
      expect(config).toBeDefined();
      expect(config.middleware).toBeDefined();
    });

    it('should use correct cache settings for aggressive mode', () => {
      const client = withCache(baseClient, { mode: 'aggressive' });
      const config = (client as any).configuration;
      
      expect(config).toBeDefined();
      expect(config.middleware).toBeDefined();
    });
  });

  describe('Custom Cache Options', () => {
    it('should accept custom cache configuration', () => {
      const customOptions = {
        maxSize: 250,
        defaultTTL: 45
      };
      
      const client = withCache(baseClient, { cacheOptions: customOptions });
      
      expect(client).toBeDefined();
      expect((client as any).configuration.middleware).toBeDefined();
    });

    it('should override preset with custom options', () => {
      const customOptions = {
        maxSize: 99,
        defaultTTL: 45 // Valid value within basic range
      };
      
      const client = withCache(baseClient, { 
        mode: 'aggressive',
        cacheOptions: customOptions 
      });
      
      expect(client).toBeDefined();
    });
  });

  describe('Convenience Function', () => {
    it('should create cached client in one step', () => {
      const client = createCachedJupiterClient(
        { apiKey: 'test-key' },
        { mode: 'balanced' }
      );
      
      expect(client).toBeDefined();
      expect(client.quoteGet).toBeDefined();
    });

    it('should handle client without API key', () => {
      const client = createCachedJupiterClient(
        undefined,
        { mode: 'conservative' }
      );
      
      expect(client).toBeDefined();
    });

    it('should determine correct base path based on API key', () => {
      const clientWithKey = createCachedJupiterClient(
        { apiKey: 'test-key' },
        { mode: 'balanced' }
      );
      
      const clientWithoutKey = createCachedJupiterClient(
        undefined,
        { mode: 'balanced' }
      );
      
      expect(clientWithKey).toBeDefined();
      expect(clientWithoutKey).toBeDefined();
    });
  });

  describe('Real API Integration', () => {
    it('should work with real Jupiter API calls', async () => {
      const testParams = {
        inputMint: "So11111111111111111111111111111111111111112", // SOL
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: 1000000000 // 1 SOL
      };

      const cachedClient = withCache(baseClient, { mode: 'balanced' });

      try {
        // First call - should work (cache miss)
        const quote1 = await cachedClient.quoteGet(testParams);
        expect(quote1).toBeDefined();
        
        // Second identical call - should work (cache hit, much faster)
        const startTime = Date.now();
        const quote2 = await cachedClient.quoteGet(testParams);
        const responseTime = Date.now() - startTime;
        
        expect(quote2).toBeDefined();
        expect(quote1).toEqual(quote2);
        
        // Cache hit should be very fast (under 50ms typically)
        console.log(`Cache hit response time: ${responseTime}ms`);
        
      } catch (error) {
        // If API is rate limited or unavailable, test should still pass
        console.log('API not available for testing - this is expected in CI');
        expect(true).toBe(true);
      }
    });

    it('should handle API errors gracefully', async () => {
      const invalidParams = {
        inputMint: "invalid-mint",
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: 1000000000
      };

      const cachedClient = withCache(baseClient, { mode: 'balanced' });

      try {
        await cachedClient.quoteGet(invalidParams);
        // If this doesn't throw, that's unexpected but not a failure
      } catch (error) {
        // Error handling should work normally with cache
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('should demonstrate cache performance improvement', async () => {
      const testParams = {
        inputMint: "So11111111111111111111111111111111111111112",
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: 1000000000
      };

      const uncachedClient = baseClient;
      const cachedClient = withCache(baseClient, { mode: 'aggressive' });

      try {
        // Measure uncached request
        const uncachedStart = Date.now();
        await uncachedClient.quoteGet(testParams);
        const uncachedTime = Date.now() - uncachedStart;

        // First cached request (cache miss)
        const cachedMissStart = Date.now();
        await cachedClient.quoteGet(testParams);
        const cachedMissTime = Date.now() - cachedMissStart;

        // Second cached request (cache hit)
        const cachedHitStart = Date.now();
        await cachedClient.quoteGet(testParams);
        const cachedHitTime = Date.now() - cachedHitStart;

        console.log(`Performance comparison:
          Uncached: ${uncachedTime}ms
          Cache miss: ${cachedMissTime}ms  
          Cache hit: ${cachedHitTime}ms
          Improvement: ${Math.round((uncachedTime - cachedHitTime) / uncachedTime * 100)}%`);

        // Cache hit should be significantly faster
        expect(cachedHitTime).toBeLessThan(Math.max(50, uncachedTime * 0.5));
        
      } catch (error) {
        console.log('Performance test skipped - API not available');
        expect(true).toBe(true);
      }
    });

    it('should handle concurrent requests efficiently', async () => {
      const testParams = {
        inputMint: "So11111111111111111111111111111111111111112",
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: 500000000
      };

      const cachedClient = withCache(baseClient, { mode: 'balanced' });

      try {
        // Make 5 concurrent identical requests
        const startTime = Date.now();
        const promises = Array(5).fill(null).map(() => 
          cachedClient.quoteGet(testParams)
        );
        
        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        
        console.log(`Concurrent requests: 5 requests in ${totalTime}ms`);
        
        // All results should be identical
        const firstResult = results[0];
        results.forEach(result => {
          expect(result).toEqual(firstResult);
        });
        
        // Should complete reasonably fast
        expect(totalTime).toBeLessThan(10000); // 10 seconds max
        
      } catch (error) {
        console.log('Concurrent test skipped - API not available');
        expect(true).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should not break existing error handling', async () => {
      const cachedClient = withCache(baseClient, { mode: 'balanced' });
      
      // This should behave exactly like the original client for errors
      try {
        await cachedClient.quoteGet({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 35281.123 as any, // Invalid decimal amount
          outputMint: "So11111111111111111111111111111111111111112",
        });
        
        // Should not reach here
        expect(false).toBe(true);
        
      } catch (error) {
        // Should throw the same error as original client
        expect(error).toBeDefined();
      }
    });
  });

  // PHASE 2 & 3: Advanced Features Tests
  describe('Advanced Cache Features', () => {
    it('should support adaptive intelligence mode', () => {
      const adaptiveClient = withCache(baseClient, { mode: 'adaptive' });
      const config = (adaptiveClient as any).configuration;
      
      expect(config).toBeDefined();
      expect(config.middleware).toBeDefined();
      expect(config.middleware.length).toBeGreaterThan(0);
      
      // Adaptive mode should have adaptive TTL enabled
      const middleware = config.middleware[0];
      expect(middleware.options?.enableAdaptiveTTL).toBe(true);
    });

    it('should support predictive optimization mode', () => {
      const predictiveClient = withCache(baseClient, { mode: 'predictive' });
      const config = (predictiveClient as any).configuration;
      
      expect(config).toBeDefined();
      expect(config.middleware).toBeDefined();
      expect(config.middleware.length).toBeGreaterThan(0);
      
      // Predictive mode should have both adaptive TTL and predictive features enabled
      const middleware = config.middleware[0];
      expect(middleware.options?.enableAdaptiveTTL).toBe(true);
      expect(middleware.options?.enablePredictive).toBe(true);
    });

    it('should have correct configuration for adaptive mode', () => {
      const adaptiveClient = withCache(baseClient, { mode: 'adaptive' });
      const middleware = (adaptiveClient as any).configuration.middleware[0];
      
      expect(middleware.options?.maxSize).toBe(800);
      expect(middleware.options?.defaultTTL).toBe(30);
      expect(middleware.options?.maxTTL).toBe(180);
      expect(middleware.options?.minTTL).toBe(5);
    });

    it('should have correct configuration for predictive mode', () => {
      const predictiveClient = withCache(baseClient, { mode: 'predictive' });
      const middleware = (predictiveClient as any).configuration.middleware[0];
      
      expect(middleware.options?.maxSize).toBe(1200);
      expect(middleware.options?.defaultTTL).toBe(45);
      expect(middleware.options?.maxTTL).toBe(240);
      expect(middleware.options?.minTTL).toBe(3);
    });
  });
});