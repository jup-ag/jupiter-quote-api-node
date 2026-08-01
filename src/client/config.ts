import { Configuration, type FetchAPI, type HTTPHeaders } from "../../generated/runtime";

export type JupiterApiService =
  | "lend"
  | "lendBorrow"
  | "portfolio"
  | "prediction"
  | "priceV2"
  | "priceV3"
  | "recurring"
  | "send"
  | "studio"
  | "swapV1"
  | "swapV2"
  | "tokensV1"
  | "tokensV2"
  | "tokensV2Verification"
  | "transaction"
  | "triggerV1"
  | "triggerV2"
  | "ultra";

export interface JupiterApiOptions {
  /** API key sent as the `x-api-key` header. */
  apiKey?: string;
  /** Fetch implementation used by every generated API. */
  fetch?: FetchAPI;
  /** Headers sent with every request. */
  headers?: HTTPHeaders;
  /** Base URL overrides for individual source specifications. */
  baseUrls?: Partial<Record<JupiterApiService, string>>;
}

const DEFAULT_BASE_URLS: Record<JupiterApiService, string> = {
  lend: "https://api.jup.ag",
  lendBorrow: "https://api.jup.ag",
  portfolio: "https://api.jup.ag",
  prediction: "https://api.jup.ag",
  priceV2: "https://api.jup.ag",
  priceV3: "https://api.jup.ag",
  recurring: "https://api.jup.ag",
  send: "https://api.jup.ag",
  studio: "https://api.jup.ag",
  swapV1: "https://api.jup.ag",
  swapV2: "https://api.jup.ag",
  tokensV1: "https://api.jup.ag",
  tokensV2: "https://api.jup.ag",
  tokensV2Verification: "https://api.jup.ag",
  transaction: "https://tx.jup.ag",
  triggerV1: "https://api.jup.ag",
  triggerV2: "https://api.jup.ag",
  ultra: "https://api.jup.ag",
};

function rejectBlank(value: string | undefined, name: string): void {
  if (value !== undefined && value.trim().length === 0) {
    throw new TypeError(`${name} must not be blank`);
  }
}

export function createConfiguration(
  options: JupiterApiOptions,
  service: JupiterApiService,
): Configuration {
  rejectBlank(options.apiKey, "apiKey");

  const basePath = options.baseUrls?.[service] ?? DEFAULT_BASE_URLS[service];
  rejectBlank(basePath, `baseUrls.${service}`);

  return new Configuration({
    basePath,
    fetchApi: options.fetch,
    headers: {
      ...options.headers,
      ...(options.apiKey === undefined ? {} : { "x-api-key": options.apiKey }),
    },
  });
}
