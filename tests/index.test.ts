import { ResponseError, createJupiterApiClient } from "src";
import { describe, expect, it } from "vitest";
describe("api", () => {
  const apiClient = createJupiterApiClient();
  it("success state", async () => {
    await apiClient.quoteGet({
      inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: 35281,
      outputMint: "So11111111111111111111111111111111111111112",
    });
  });

  it("error state", async () => {
    try {
      await apiClient.quoteGet({
        inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: 35281.123, // decimal
        outputMint: "So11111111111111111111111111111111111111112",
      });
    } catch (e) {
      if (e instanceof ResponseError) {
        expect(await e.response.json()).toMatchInlineSnapshot(`
          {
            "error": "Query parameter amount cannot be parsed: ParseIntError { kind: InvalidDigit }",
          }
        `);
      } else {
        throw e;
      }
    }
  });
});
