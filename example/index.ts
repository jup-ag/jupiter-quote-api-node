import fetch from "cross-fetch";
import {
  Configuration,
  DefaultApi,
  IndexedRouteMapResponse,
} from "../generated";

type RouteMap = Record<string, string[]>;

function inflateIndexedRouteMap(
  result: IndexedRouteMapResponse
): Record<string, string[]> {
  const { mintKeys, indexedRouteMap } = result;

  return Object.entries(indexedRouteMap).reduce<RouteMap>(
    (acc, [inputMintIndexString, outputMintIndices]) => {
      const inputMintIndex = Number(inputMintIndexString);
      const inputMint = mintKeys[inputMintIndex];
      if (!inputMint)
        throw new Error(`Could no find mint key for index ${inputMintIndex}`);

      acc[inputMint] = outputMintIndices.map((index) => {
        const outputMint = mintKeys[index];
        if (!outputMint)
          throw new Error(`Could no find mint key for index ${index}`);

        return outputMint;
      });

      return acc;
    },
    {}
  );
}

export async function main() {
  const config = new Configuration({
    fetchApi: fetch,
  });

  const jupiterQuoteApi = new DefaultApi(config);

  // get quote
  const quote = await jupiterQuoteApi.quoteGet({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: "100000000",
    // platformFeeBps: 10,
    // asLegacyTransaction: true, // legacy transaction, default is versoined transaction
  });

  console.log(quote);

  if (!quote) {
    console.error("unable to quote");
    return;
  }

  // get serialized transaction
  const swapResult = await jupiterQuoteApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: "HAPdsaZFfQDG4bD8vzBbPCUawUWKSJxvhQ7TGg1BeAxZ",
    },
  });

  console.log(`Transaction: ${swapResult.swapTransaction}`);

  // get route map
  const result = await jupiterQuoteApi.indexedRouteMapGet();
  const routeMap = inflateIndexedRouteMap(result);
  console.log(Object.keys(routeMap).length);
}

main();
