import fetch from "cross-fetch";
import { Configuration, DefaultApi } from "../generated";

interface IndexedRouteMapResult {
  mintKeys: string[];
  indexedRouteMap: Record<number, number[]>;
}

type RouteMap = Record<string, string[]>;

function inflateIndexedRouteMap(
  result: IndexedRouteMapResult
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
    basePath: "https://quote-api.jup.ag",
    fetchApi: fetch,
  });
  const jupiterQuoteApi = new DefaultApi(config);

  const quote = await jupiterQuoteApi.v3QuoteGet({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: "100000000",
  });
  console.log(quote?.data ? quote.data[0] : "Nothing");

  const result = (await (
    await fetch("https://quote-api.jup.ag/v1/indexed-route-map")
  ).json()) as IndexedRouteMapResult;

  const routeMap = inflateIndexedRouteMap(result);
  console.log(Object.keys(routeMap).length);
}

main();
