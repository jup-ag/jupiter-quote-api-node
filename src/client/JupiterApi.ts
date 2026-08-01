import {
  LendApi,
  LendBorrowApi,
  PortfolioApi,
  PredictionApi,
  PriceV2Api,
  PriceV3Api,
  RecurringApi,
  SendApi,
  StudioApi,
  SwapV1Api,
  SwapV2Api,
  TokensV1Api,
  TokensV2Api,
  TokensV2VerificationApi,
  TransactionApi,
  TriggerV1Api,
  TriggerV2Api,
  UltraApi,
} from "../../generated/apis";
import { createConfiguration, type JupiterApiOptions } from "./config";

/**
 * Typed access to Jupiter APIs, organized after the local OpenAPI source tree.
 */
export class JupiterApi {
  public readonly lend: {
    borrow: LendBorrowApi;
    lend: LendApi;
  };
  public readonly portfolio: PortfolioApi;
  public readonly prediction: PredictionApi;
  public readonly price: {
    v2: PriceV2Api;
    v3: PriceV3Api;
  };
  public readonly recurring: RecurringApi;
  public readonly send: SendApi;
  public readonly studio: StudioApi;
  public readonly swap: {
    v1: SwapV1Api;
    v2: SwapV2Api;
  };
  public readonly tokens: {
    v1: TokensV1Api;
    v2: TokensV2Api & { verification: TokensV2VerificationApi };
  };
  public readonly transaction: TransactionApi;
  public readonly trigger: {
    v1: TriggerV1Api;
    v2: TriggerV2Api;
  };
  public readonly ultra: UltraApi;

  public constructor(options: JupiterApiOptions = {}) {
    this.lend = {
      borrow: new LendBorrowApi(createConfiguration(options, "lendBorrow")),
      lend: new LendApi(createConfiguration(options, "lend")),
    };
    this.portfolio = new PortfolioApi(createConfiguration(options, "portfolio"));
    this.prediction = new PredictionApi(createConfiguration(options, "prediction"));
    this.price = {
      v2: new PriceV2Api(createConfiguration(options, "priceV2")),
      v3: new PriceV3Api(createConfiguration(options, "priceV3")),
    };
    this.recurring = new RecurringApi(createConfiguration(options, "recurring"));
    this.send = new SendApi(createConfiguration(options, "send"));
    this.studio = new StudioApi(createConfiguration(options, "studio"));
    this.swap = {
      v1: new SwapV1Api(createConfiguration(options, "swapV1")),
      v2: new SwapV2Api(createConfiguration(options, "swapV2")),
    };
    this.tokens = {
      v1: new TokensV1Api(createConfiguration(options, "tokensV1")),
      v2: Object.assign(new TokensV2Api(createConfiguration(options, "tokensV2")), {
        verification: new TokensV2VerificationApi(
          createConfiguration(options, "tokensV2Verification"),
        ),
      }),
    };
    this.transaction = new TransactionApi(createConfiguration(options, "transaction"));
    this.trigger = {
      v1: new TriggerV1Api(createConfiguration(options, "triggerV1")),
      v2: new TriggerV2Api(createConfiguration(options, "triggerV2")),
    };
    this.ultra = new UltraApi(createConfiguration(options, "ultra"));
  }
}
