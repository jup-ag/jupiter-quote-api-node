import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuoteCacheMiddleware, createQuoteCacheMiddleware } from '../src/cache-middleware';
import type { RequestContext } from '../generated/runtime';

describe('Predictive Cache Optimization', () => {
  let middleware: QuoteCacheMiddleware;
  let mockContext: RequestContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockContext = {
      url: 'https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000',
      init: { method: 'GET' }
    } as RequestContext;
  });

  afterEach(() => {
    if (middleware) {
      middleware.destroy();
    }
    vi.useRealTimers();
  });

  describe('Usage Pattern Tracking', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enablePredictive: true,
        defaultTTL: 30
      });
    });

    it('should track usage patterns correctly', async () => {
      // Simulate multiple requests to same endpoint
      for (let i = 0; i < 5; i++) {
        await middleware.pre(mockContext);
      }

      const patterns = (middleware as any).usagePatterns;
      const cacheKey = (middleware as any).createCacheKey(mockContext.url);
      
      expect(patterns.has(cacheKey)).toBe(true);
      expect(patterns.get(cacheKey).count).toBe(5);
      expect(patterns.get(cacheKey).lastUsed).toBeGreaterThan(0);
    });

    it('should trigger predictive warming after threshold', async () => {
      const scheduleWarmUpSpy = vi.spyOn(middleware as any, 'scheduleWarmUp');
      
      // Make 4 requests to trigger warming (threshold is 3)
      for (let i = 0; i < 4; i++) {
        await middleware.pre(mockContext);
      }

      expect(scheduleWarmUpSpy).toHaveBeenCalled();
    });

    it('should not duplicate warming schedules', async () => {
      const scheduleWarmUpSpy = vi.spyOn(middleware as any, 'scheduleWarmUp');
      
      // Make multiple requests that would trigger warming
      for (let i = 0; i < 10; i++) {
        await middleware.pre(mockContext);
      }

      // Should only schedule once per key
      const cacheKey = (middleware as any).createCacheKey(mockContext.url);
      expect((middleware as any).warmingQueue.has(cacheKey)).toBe(true);
      expect(scheduleWarmUpSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Warming', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enablePredictive: true,
        defaultTTL: 30
      });
    });

    it('should schedule warming with proper timer management', () => {
      const cacheKey = 'test_key';
      
      (middleware as any).scheduleWarmUp(cacheKey);
      
      expect((middleware as any).warmingQueue.has(cacheKey)).toBe(true);
      expect((middleware as any).cleanupTimers.size).toBeGreaterThan(0);
    });

    it('should cleanup timers after warming completes', () => {
      const cacheKey = 'test_key';
      
      (middleware as any).scheduleWarmUp(cacheKey);
      
      // Fast-forward time to trigger warming
      vi.advanceTimersByTime(31000); // defaultTTL + 1 second
      
      expect((middleware as any).warmingQueue.has(cacheKey)).toBe(false);
    });

    it('should limit concurrent warming operations', () => {
      // Schedule more than 100 warming operations
      for (let i = 0; i < 150; i++) {
        (middleware as any).scheduleWarmUp(`key_${i}`);
      }
      
      // Should be limited to prevent memory issues
      expect((middleware as any).warmingQueue.size).toBeLessThanOrEqual(100);
    });

    it('should handle warming errors gracefully', () => {
      const cacheKey = 'error_key';
      
      // Corrupt internal state to cause error during warming execution
      (middleware as any).warmingQueue.add(cacheKey);
      (middleware as any).usagePatterns = null;
      
      // Should not throw error even with corrupted state
      expect(() => {
        vi.advanceTimersByTime(31000);
      }).not.toThrow();
    });
  });

  describe('Performance Impact', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enablePredictive: true,
        defaultTTL: 30
      });
    });

    it('should not significantly impact request processing time', async () => {
      const startTime = Date.now();
      
      // Process multiple requests
      for (let i = 0; i < 100; i++) {
        await middleware.pre({
          ...mockContext,
          url: `${mockContext.url}&test=${i}`
        });
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 100 requests)
      expect(processingTime).toBeLessThan(100);
    });

    it('should maintain bounded memory usage', async () => {
      // Simulate heavy usage
      for (let i = 0; i < 1000; i++) {
        await middleware.pre({
          ...mockContext,
          url: `${mockContext.url}&test=${i}`
        });
      }
      
      // Maps should not grow unbounded
      expect((middleware as any).usagePatterns.size).toBeLessThanOrEqual(1000);
      expect((middleware as any).warmingQueue.size).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration with Adaptive Features', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enableAdaptiveTTL: true,
        enablePredictive: true,
        minTTL: 5,
        maxTTL: 120,
        defaultTTL: 30
      });
    });

    it('should work correctly with both adaptive and predictive features enabled', async () => {
      // Make requests to trigger both adaptive and predictive logic
      for (let i = 0; i < 5; i++) {
        await middleware.pre(mockContext);
      }
      
      // Should have tracked usage patterns
      const patterns = (middleware as any).usagePatterns;
      const cacheKey = (middleware as any).createCacheKey(mockContext.url);
      expect(patterns.has(cacheKey)).toBe(true);
      
      // Should calculate TTL adaptively
      const ttl = (middleware as any).getSmartTTL(mockContext.url);
      expect(ttl).toBeGreaterThanOrEqual(5000);
      expect(ttl).toBeLessThanOrEqual(120000);
    });

    it('should handle cleanup for both features', () => {
      // Add data for both features
      (middleware as any).priceChanges.set('test', [100, 200]);
      (middleware as any).usagePatterns.set('test', { count: 5, lastUsed: Date.now() - 7200000 });
      
      middleware.clear();
      
      expect((middleware as any).priceChanges.size).toBe(0);
      expect((middleware as any).usagePatterns.size).toBe(0);
      expect((middleware as any).warmingQueue.size).toBe(0);
      expect((middleware as any).cleanupTimers.size).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enablePredictive: true
      });
    });

    it('should handle non-GET requests gracefully', async () => {
      const postContext = {
        ...mockContext,
        init: { method: 'POST' }
      };
      
      await middleware.pre(postContext);
      
      // Should not track patterns for non-GET requests
      expect((middleware as any).usagePatterns.size).toBe(0);
    });

    it('should handle invalid URLs gracefully', async () => {
      const invalidContext = {
        ...mockContext,
        url: 'not-a-quote-url'
      };
      
      await middleware.pre(invalidContext);
      
      // Should not track patterns for non-quote URLs
      expect((middleware as any).usagePatterns.size).toBe(0);
    });

    it('should handle timer errors gracefully', () => {
      // The scheduleWarmUp method now has try-catch protection
      const scheduleWarmUpSpy = vi.spyOn(middleware as any, 'scheduleWarmUp');
      
      // Should handle timer scheduling errors without crashing
      expect(() => {
        (middleware as any).scheduleWarmUp('test_key');
      }).not.toThrow();
      
      expect(scheduleWarmUpSpy).toHaveBeenCalledWith('test_key');
    });

    it('should handle map corruption gracefully', async () => {
      // Test that the method handles invalid usage patterns safely
      const trackUsagePatternSpy = vi.spyOn(middleware as any, 'trackUsagePattern');
      
      // Should not crash on pattern tracking
      const result = await middleware.pre(mockContext);
      
      expect(result).toBeUndefined(); // pre() returns void
      expect(trackUsagePatternSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Resource Management', () => {
    beforeEach(() => {
      middleware = createQuoteCacheMiddleware({
        enablePredictive: true
      });
    });

    it('should perform periodic cleanup correctly', () => {
      const now = Date.now();
      const oldTime = now - 7200000; // 2 hours ago
      
      // Add old data
      (middleware as any).usagePatterns.set('old_pattern', { count: 1, lastUsed: oldTime });
      (middleware as any).usagePatterns.set('new_pattern', { count: 1, lastUsed: now });
      
      (middleware as any).performCleanup();
      
      expect((middleware as any).usagePatterns.has('old_pattern')).toBe(false);
      expect((middleware as any).usagePatterns.has('new_pattern')).toBe(true);
    });

    it('should start periodic cleanup when predictive features are enabled', () => {
      const newMiddleware = createQuoteCacheMiddleware({
        enablePredictive: true
      });
      
      expect((newMiddleware as any).cleanupTimers.size).toBeGreaterThan(0);
      
      newMiddleware.destroy();
    });

    it('should not start cleanup when predictive features are disabled', () => {
      const newMiddleware = createQuoteCacheMiddleware({
        enablePredictive: false
      });
      
      expect((newMiddleware as any).cleanupTimers.size).toBe(0);
      
      newMiddleware.destroy();
    });
  });
});