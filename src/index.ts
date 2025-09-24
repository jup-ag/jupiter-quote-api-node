import { TokenApi } from "generated/apis";
import { SwapApi } from "../generated/apis/SwapApi";
import { ConfigurationParameters, Configuration } from "../generated/runtime";

interface UrlConfig {
  PUBLIC: string;
  API_KEY: string;
}

// Define server URLs
const serverUrls: Record<string, UrlConfig> = {
  swap: {
    PUBLIC: "https://lite-api.jup.ag/swap/v1",
    API_KEY: "https://api.jup.ag/swap/v1",
  },
  token: {
    PUBLIC: "https://lite-api.jup.ag/tokens/v2",
    API_KEY: "https://api.jup.ag/tokens/v2",
  },
}

/**
 * Creates a Jupiter API client with optional API key support
 * @param config Configuration parameters
 * @returns Jupiter API instance partitioned by category
 */
export const createJupiterApiClient = (config?: ConfigurationParameters) => {
  return {
    swap: new SwapApi(urlConfig(serverUrls.swap, config)),
    token: new TokenApi(urlConfig(serverUrls.token, config))
  }
};

/**
 * Attaches Server Urls to optional ConfigurationParameters
 * @param urls Server Urls (i.e. API Routes)
 * @param config Configuration parameters
 * @returns Api Configuration with Server Urls
 */
const urlConfig = (urls: UrlConfig, config?: ConfigurationParameters): Configuration => {
  // Determine which server URL to use based on whether an API key is provided
  const hasApiKey = config?.apiKey !== undefined;
  // Create a new configuration with the appropriate base path
  const configWithServer: ConfigurationParameters = {
    ...config,
    basePath: hasApiKey ? urls.API_KEY : urls.PUBLIC,
    headers: hasApiKey ? { 'x-api-key': config?.apiKey as string } : undefined
  };
  return new Configuration(configWithServer);
}

export * from "../generated";
