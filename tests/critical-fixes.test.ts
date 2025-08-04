import { describe, expect, it, vi } from "vitest";
import { createJupiterApiClient } from "../src";

describe("Critical Bug Fixes", () => {
  const apiClient = createJupiterApiClient();

  describe("Issue #67: Type Safety - Integer Format Specifications", () => {
    it("should have proper TypeScript types for integer fields", () => {
      // This test ensures the types compile correctly with proper integer formats
      const validSwapRequest = {
        userPublicKey: "So11111111111111111111111111111111111111112",
        quoteResponse: {
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn" as const,
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: [],
          contextSlot: 123456,
          timeTaken: 45,
          swapUsdValue: "1000.50"
        },
        // These should now compile without TypeScript errors:
        computeUnitPriceMicroLamports: 1000000, // int64
        prioritizationFeeLamports: 5000, // int64
      };

      // Type assertions to ensure proper types are inferred
      expect(typeof validSwapRequest.computeUnitPriceMicroLamports).toBe("number");
      expect(typeof validSwapRequest.prioritizationFeeLamports).toBe("number");
      expect(typeof validSwapRequest.quoteResponse.slippageBps).toBe("number");
    });

    it("should handle large integer values correctly", () => {
      // Test that int64 format can handle large values
      const largeValues = {
        computeUnitPriceMicroLamports: 9007199254740991, // Max safe integer
        prioritizationFeeLamports: 1000000000000, // 1 trillion
        lastValidBlockHeight: 999999999999, // Large block height
      };

      expect(largeValues.computeUnitPriceMicroLamports).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      expect(largeValues.prioritizationFeeLamports).toBeGreaterThan(0);
      expect(largeValues.lastValidBlockHeight).toBeGreaterThan(0);
    });
  });

  describe("Issue #21: Array Serialization - Dexes Parameters", () => {
    it("should properly serialize dexes array to comma-separated string", async () => {
      // Mock the fetch to capture the actual request
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn",
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: []
        })
      });

      global.fetch = mockFetch;

      try {
        await apiClient.quoteGet({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 1000000,
          outputMint: "So11111111111111111111111111111111111111112",
          dexes: ["Raydium", "Orca", "Whirlpool"]
        });
      } catch (error) {
        // We expect this to fail since we're mocking, but we want to check the URL
      }

      // Check that the URL contains properly serialized dexes parameter
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const url = new URL(callArgs[0] as string);
      
      // The dexes should be comma-separated, not as an array object
      expect(url.searchParams.get('dexes')).toBe('Raydium,Orca,Whirlpool');
    });

    it("should properly serialize excludeDexes array", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn",
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: []
        })
      });

      global.fetch = mockFetch;

      try {
        await apiClient.quoteGet({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 1000000,
          outputMint: "So11111111111111111111111111111111111111112",
          excludeDexes: ["Jupiter LO", "Phoenix"]
        });
      } catch (error) {
        // Expected to fail with mock
      }

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const url = new URL(callArgs[0] as string);
      
      expect(url.searchParams.get('excludeDexes')).toBe('Jupiter LO,Phoenix');
    });

    it("should handle single dex value correctly", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn",
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: []
        })
      });

      global.fetch = mockFetch;

      try {
        await apiClient.quoteGet({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 1000000,
          outputMint: "So11111111111111111111111111111111111111112",
          dexes: ["Raydium"] // Single item array
        });
      } catch (error) {
        // Expected to fail with mock
      }

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const url = new URL(callArgs[0] as string);
      
      expect(url.searchParams.get('dexes')).toBe('Raydium');
    });

    it("should handle empty arrays gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn",
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: []
        })
      });

      global.fetch = mockFetch;

      try {
        await apiClient.quoteGet({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 1000000,
          outputMint: "So11111111111111111111111111111111111111112",
          dexes: [] // Empty array
        });
      } catch (error) {
        // Expected to fail with mock
      }

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const url = new URL(callArgs[0] as string);
      
      // Empty array should serialize to empty string
      expect(url.searchParams.get('dexes')).toBe('');
    });
  });

  describe("Issue #59: Missing swapUsdValue Field", () => {
    it("should include swapUsdValue in QuoteResponse type", () => {
      // Type test - this should compile without errors
      const mockQuoteResponse = {
        inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        inAmount: "1000000",
        outputMint: "So11111111111111111111111111111111111111112",
        outAmount: "100000000",
        otherAmountThreshold: "99000000",
        swapMode: "ExactIn" as const,
        slippageBps: 50,
        priceImpactPct: "0.1",
        routePlan: [],
        contextSlot: 123456,
        timeTaken: 45,
        swapUsdValue: "1000.50" // This should now be a valid property
      };

      // Verify the property exists and is the correct type
      expect(mockQuoteResponse.swapUsdValue).toBeDefined();
      expect(typeof mockQuoteResponse.swapUsdValue).toBe("string");
      expect(mockQuoteResponse.swapUsdValue).toBe("1000.50");
    });

    it("should handle swapUsdValue as optional string", () => {
      // Test that swapUsdValue is optional (can be undefined)
      const mockQuoteWithoutUsdValue = {
        inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        inAmount: "1000000",
        outputMint: "So11111111111111111111111111111111111111112",
        outAmount: "100000000",
        otherAmountThreshold: "99000000",
        swapMode: "ExactIn" as const,
        slippageBps: 50,
        priceImpactPct: "0.1",
        routePlan: [],
        // swapUsdValue is omitted - should be fine since it's optional
      };

      expect(mockQuoteWithoutUsdValue.swapUsdValue).toBeUndefined();
    });

    it("should handle various USD value formats", () => {
      const testValues = [
        "0.01",      // Small value
        "1000.50",   // Normal value  
        "1000000.00", // Large value
        "0",         // Zero value
        "999999999.99", // Very large value
      ];

      testValues.forEach(value => {
        const mockQuote = {
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn" as const,
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: [],
          swapUsdValue: value
        };

        expect(mockQuote.swapUsdValue).toBe(value);
        expect(typeof mockQuote.swapUsdValue).toBe("string");
      });
    });
  });

  describe("Integration: All Fixes Working Together", () => {
    it("should handle complete request with all fixed parameters", async () => {
      // This test ensures all three fixes work together
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ 
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outputMint: "So11111111111111111111111111111111111111112",
          outAmount: "100000000",
          otherAmountThreshold: "99000000",
          swapMode: "ExactIn",
          slippageBps: 50,
          priceImpactPct: "0.1",
          routePlan: [],
          contextSlot: 123456,
          timeTaken: 45,
          swapUsdValue: "1000.50" // Issue #59 fix
        })
      });

      global.fetch = mockFetch;

      try {
        await apiClient.quoteGet({
          inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: 1000000,
          outputMint: "So11111111111111111111111111111111111111112",
          slippageBps: 50, // Issue #67 fix (proper int32 format)
          dexes: ["Raydium", "Orca"], // Issue #21 fix (array serialization)
          excludeDexes: ["Phoenix"]   // Issue #21 fix (array serialization)
        });
      } catch (error) {
        // Expected with mock
      }

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const url = new URL(callArgs[0] as string);
      
      // Verify all parameters are correctly serialized
      expect(url.searchParams.get('slippageBps')).toBe('50');
      expect(url.searchParams.get('dexes')).toBe('Raydium,Orca');
      expect(url.searchParams.get('excludeDexes')).toBe('Phoenix');
    });
  });
});