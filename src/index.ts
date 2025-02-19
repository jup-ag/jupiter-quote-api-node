import { SwapApi } from "../generated/apis/SwapApi";
import { ConfigurationParameters, Configuration } from "../generated/runtime";

export const createJupiterApiClient = (config?: ConfigurationParameters) => {
  return new SwapApi(new Configuration(config));
};

export * from "../generated";
