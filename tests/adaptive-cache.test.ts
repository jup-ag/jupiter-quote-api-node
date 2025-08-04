import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuoteCacheMiddleware, createQuoteCacheMiddleware } from '../src/cache-middleware';
import type { RequestContext, ResponseContext } from '../generated/runtime';

describe('Adaptive Cache Intelligence', () => {
  let middleware: QuoteCacheMiddleware;
  let mockContext: RequestContext;
  let mockResponseContext: ResponseContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      url: 'https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000',
      init: { method: 'GET' }
    } as RequestContext;

    mockResponseContext = {
      url: mockContext.url,
      response: new Response(JSON.stringify({
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        inAmount: '1000000',
        outAmount: '45123456'
      }), { status: 200 })
    } as ResponseContext;
  });

  afterEach(() => {
    if (middleware) {
      middleware.destroy();
    }
  });

  describe('Configuration Validation', () => {
    it('should throw error when minTTL >= maxTTL', () => {
      expect(() => {
        createQuoteCacheMiddleware({
          minTTL: 60,
          maxTTL: 30,
          enableAdaptiveTTL: true
        });
      }).toThrow('minTTL (60) must be less than maxTTL (30)');
    });

    it('should throw error when defaultTTL is out of range', () => {
      expect(() => {
        createQuoteCacheMiddleware({
          defaultTTL: 100,
          minTTL: 5,
          maxTTL: 30,
          enableAdaptiveTTL: true
        });
      }).toThrow('defaultTTL (100) must be between minTTL (5) and maxTTL (30)');
    });

    it('should throw error when maxSize is invalid (only with advanced features)', () => {
      expect(() => {
        createQuoteCacheMiddleware({
          maxSize: 0,
          enableAdaptiveTTL: true
        });
      }).toThrow('maxSize (0) must be between 1 and 10000');

      expect(() => {
        createQuoteCacheMiddleware({
          maxSize: 15000,
          enableAdaptiveTTL: true
        });
      }).toThrow('maxSize (15000) must be between 1 and 10000');

      // Should NOT throw for basic caching without advanced features
      expect(() => {
        createQuoteCacheMiddleware({
          maxSize: 0
        });
      }).not.toThrow();
    });

    it('should accept valid configuration', () => {
      expect(() => {
        middleware = createQuoteCacheMiddleware({
          minTTL: 5,
          maxTTL: 120,
          defaultTTL: 30,
          maxSize: 1000,
          enableAdaptiveTTL: true
        });
      }).not.toThrow();
    });
  });

  describe('Volatility Detection', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enableAdaptiveTTL: true,
        minTTL: 5,
        maxTTL: 120,
        defaultTTL: 30
      });
    });

    it('should handle invalid price data gracefully', async () => {
      const invalidResponse = {
        ...mockResponseContext,
        response: new Response(JSON.stringify({
          outAmount: 'invalid_number'
        }), { status: 200 })
      };

      // Should not throw error
      await expect(middleware.post(invalidResponse)).resolves.toBeDefined();
    });

    it('should handle missing outAmount gracefully', async () => {
      const invalidResponse = {
        ...mockResponseContext,
        response: new Response(JSON.stringify({
          inputMint: 'test'
          // missing outAmount
        }), { status: 200 })
      };

      await expect(middleware.post(invalidResponse)).resolves.toBeDefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      const invalidResponse = {
        ...mockResponseContext,
        response: new Response('invalid json{', { status: 200 })
      };

      await expect(middleware.post(invalidResponse)).resolves.toBeDefined();
    });

    it('should track price changes correctly', async () => {
      // Simulate multiple requests with price changes
      const prices = ['45123456', '46000000', '44000000', '47000000'];
      
      for (const price of prices) {
        const response = {
          ...mockResponseContext,
          response: new Response(JSON.stringify({
            outAmount: price
          }), { status: 200 })
        };
        
        await middleware.post(response);
      }

      // Access private method for testing (not ideal but necessary for unit testing)
      const volatility = (middleware as any).calculateVolatility(
        (middleware as any).createCacheKey(mockContext.url)
      );
      
      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(1); // Should be reasonable volatility
      expect(isFinite(volatility)).toBe(true);
    });

    it('should handle zero and negative prices safely', async () => {
      const problematicPrices = ['0', '-1000', 'Infinity', 'NaN'];
      
      for (const price of problematicPrices) {
        const response = {
          ...mockResponseContext,
          response: new Response(JSON.stringify({
            outAmount: price
          }), { status: 200 })
        };
        
        await middleware.post(response);
      }

      // Should not crash and should return safe volatility
      const volatility = (middleware as any).calculateVolatility(
        (middleware as any).createCacheKey(mockContext.url)
      );
      
      expect(volatility).toBe(0);
    });

    it('should calculate volatility with edge cases', () => {
      // Test with single price point
      const singlePriceVolatility = (middleware as any).calculateVolatility('nonexistent_key');
      expect(singlePriceVolatility).toBe(0);

      // Test with identical prices (zero volatility)
      const priceChanges = new Map();
      priceChanges.set('test_key', [100, 100, 100, 100]);
      (middleware as any).priceChanges = priceChanges;
      
      const zeroVolatility = (middleware as any).calculateVolatility('test_key');
      expect(zeroVolatility).toBe(0);
    });
  });

  describe('Adaptive TTL Calculation', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enableAdaptiveTTL: true,
        minTTL: 5,
        maxTTL: 120,
        defaultTTL: 30
      });
    });

    it('should return TTL within bounds', () => {
      const ttl = (middleware as any).getSmartTTL(mockContext.url);
      expect(ttl).toBeGreaterThanOrEqual(5000); // minTTL in ms
      expect(ttl).toBeLessThanOrEqual(120000); // maxTTL in ms
    });

    it('should adjust TTL based on volatility', async () => {
      // Simulate high volatility scenario
      const highVolatilityPrices = ['100000', '150000', '80000', '200000', '60000'];
      
      for (const price of highVolatilityPrices) {
        const response = {
          ...mockResponseContext,
          response: new Response(JSON.stringify({
            outAmount: price
          }), { status: 200 })
        };
        
        await middleware.post(response);
      }

      const highVolatilityTTL = (middleware as any).getSmartTTL(mockContext.url);
      
      // Should be closer to minTTL due to high volatility
      expect(highVolatilityTTL).toBeLessThan(30000); // Less than default TTL
      expect(highVolatilityTTL).toBeGreaterThanOrEqual(5000); // But not below min
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enableAdaptiveTTL: true,
        enablePredictive: true
      });
    });

    it('should cleanup old data periodically', () => {
      // Add old usage patterns
      const oldPattern = { count: 5, lastUsed: Date.now() - 7200000 }; // 2 hours ago
      (middleware as any).usagePatterns.set('old_key', oldPattern);
      
      // Trigger cleanup
      (middleware as any).performCleanup();
      
      // Old patterns should be removed
      expect((middleware as any).usagePatterns.has('old_key')).toBe(false);
    });

    it('should limit map sizes to prevent memory leaks', () => {
      // Fill maps beyond limit
      for (let i = 0; i < 1200; i++) {
        (middleware as any).priceChanges.set(`key_${i}`, [100, 200]);
        (middleware as any).usagePatterns.set(`pattern_${i}`, { count: 1, lastUsed: Date.now() });
      }
      
      // Trigger cleanup
      (middleware as any).performCleanup();
      
      // Should be limited to reasonable size
      expect((middleware as any).priceChanges.size).toBeLessThanOrEqual(500);
      expect((middleware as any).usagePatterns.size).toBeLessThanOrEqual(500);
    });

    it('should clear all timers on destroy', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      // Add some timers
      (middleware as any).scheduleWarmUp('test_key');
      
      // Destroy middleware
      middleware.destroy();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Error Resilience', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enableAdaptiveTTL: true,
        enablePredictive: true
      });
    });

    it('should handle response cloning errors', async () => {
      const mockResponse = {
        clone: () => { throw new Error('Clone failed'); }
      } as any;

      const errorContext = {
        ...mockResponseContext,
        response: mockResponse
      };

      // Should not throw error
      await expect(middleware.post(errorContext)).resolves.toBeDefined();
    });

    it('should handle calculation errors gracefully', () => {
      // Force calculation error by corrupting internal state
      (middleware as any).priceChanges.set('error_key', [null, undefined, 'invalid']);
      
      const volatility = (middleware as any).calculateVolatility('error_key');
      expect(volatility).toBe(0); // Safe fallback
    });
  });
});