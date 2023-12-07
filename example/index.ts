import { createJupiterApiClient, IndexedRouteMapResponse } from "../src/index";

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
  const jupiterQuoteApi = createJupiterApiClient();

  // get quote
  const quote = await jupiterQuoteApi.quoteGet({
    inputMint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    amount: 35281,
    slippageBps: 100,
    onlyDirectRoutes: false,
    asLegacyTransaction: false,
  });

  if (!quote) {
    console.error("unable to quote");
    return;
  }

  // get serialized transaction
  const swapResult = await jupiterQuoteApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: "HAPdsaZFfQDG4bD8vzBbPCUawUWKSJxvhQ7TGg1BeAxZ",
      dynamicComputeUnitLimit: true,
    },
  });

  console.dir(swapResult, { depth: null });

  // get route map
  const result = await jupiterQuoteApi.indexedRouteMapGet();
  const routeMap = inflateIndexedRouteMap(result);
  console.log(Object.keys(routeMap).length);
}

main();
