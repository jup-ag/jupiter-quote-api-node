import { DefaultApi } from "../generated/apis/DefaultApi";
import { ConfigurationParameters, Configuration } from "../generated/runtime";

export const createJupiterApiClient = (config?: ConfigurationParameters) => {
  return new DefaultApi(new Configuration(config));
};

export * from "../generated";
