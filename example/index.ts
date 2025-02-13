import {
  QuoteGetRequest,
  QuoteResponse,
  SwapResponse,
  createJupiterApiClient,
} from "../src/index";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";
import { transactionSenderAndConfirmationWaiter } from "./utils/transactionSender";
import { getSignature } from "./utils/getSignature";

// If you have problem landing transactions, read this too: https://station.jup.ag/docs/apis/landing-transactions

// Make sure that you are using your own RPC endpoint. This RPC doesn't work.
// Helius and Triton have staked SOL and they can usually land transactions better.
const connection = new Connection(
  "https://api.mainnet-beta.solana.com" // We only support mainnet.
);
const jupiterQuoteApi = createJupiterApiClient();

async function getQuote() {
  const params: QuoteGetRequest = {
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: 100000000, // 0.1 SOL
    slippageBps: 100, // 1%
  };

  // get quote
  const quote = await jupiterQuoteApi.quoteGet(params);

  if (!quote) {
    throw new Error("unable to quote");
  }
  return quote;
}

async function getSwapResponse(wallet: Wallet, quote: QuoteResponse) {
  // Get serialized transaction
  const swapResponse = await jupiterQuoteApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 10000000,
          priorityLevel: "veryHigh", // If you want to land transaction fast, set this to use `veryHigh`. You will pay on average higher priority fee.
        },
      },
      correctLastValidBlockHeight: true,
    },
  });
  return swapResponse;
}

async function flowQuote() {
  const quote = await getQuote();
  console.dir(quote, { depth: null });
}

async function flowQuoteAndSwap() {
  const wallet = new Wallet(
    Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
  );
  console.log("Wallet:", wallet.publicKey.toBase58());

  const quote = await getQuote();
  console.dir(quote, { depth: null });
  const swapResponse = await getSwapResponse(wallet, quote);
  console.dir(swapResponse, { depth: null });

  // Serialize the transaction
  const swapTransactionBuf = Buffer.from(
    swapResponse.swapTransaction,
    "base64"
  );
  var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  // Sign the transaction
  transaction.sign([wallet.payer]);
  const signature = getSignature(transaction);

  // We first simulate whether the transaction would be successful
  const { value: simulatedTransactionResponse } =
    await connection.simulateTransaction(transaction, {
      replaceRecentBlockhash: true,
      commitment: "processed",
    });
  const { err, logs } = simulatedTransactionResponse;

  if (err) {
    // Simulation error, we can check the logs for more details
    // If you are getting an invalid account error, make sure that you have the input mint account to actually swap from.
    console.error("Simulation Error:");
    console.error({ err, logs });
    return;
  }

  const serializedTransaction = Buffer.from(transaction.serialize());
  const blockhash = transaction.message.recentBlockhash;

  const transactionResponse = await transactionSenderAndConfirmationWaiter({
    connection,
    serializedTransaction,
    blockhashWithExpiryBlockHeight: {
      blockhash,
      lastValidBlockHeight: swapResponse.lastValidBlockHeight,
    },
  });

  // If we are not getting a response back, the transaction has not confirmed.
  if (!transactionResponse) {
    console.error("Transaction not confirmed");
    return;
  }

  if (transactionResponse.meta?.err) {
    console.error(transactionResponse.meta?.err);
  }

  console.log(`https://solscan.io/tx/${signature}`);
}

export async function main() {
  switch (process.env.FLOW) {
    case "quote": {
      await flowQuote();
      break;
    }

    case "quoteAndSwap": {
      await flowQuoteAndSwap();
      break;
    }

    default: {
      console.error("Please set the FLOW environment");
    }
  }
}

main();
