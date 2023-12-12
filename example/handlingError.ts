import { ResponseError, createJupiterApiClient } from "src";

async function main() {
  try {
    const jupiterQuoteApi = createJupiterApiClient();

    await jupiterQuoteApi.quoteGet({
      inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: 35281.123, // decimal
      outputMint: "So11111111111111111111111111111111111111112",
    });
  } catch (e) {
    if (e instanceof ResponseError) {
      console.log(await e.response.json());
    }
  }
}

main();
