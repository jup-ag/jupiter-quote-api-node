import {
  QuoteGetRequest,
  QuoteResponse,
  SwapResponse,
  createJupiterApiClient,
  JupiterQuoteApi,
} from "../src/index";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";
import { transactionSenderAndConfirmationWaiter } from "./utils/transactionSender";
import { getSignature } from "./utils/getSignature";
import dotenv from "dotenv";

dotenv.config();

// --- CRITICAL ENVIRONMENT CHECKS ---
const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
  throw new Error("RPC_URL environment variable is not set. Please use a reliable endpoint like Helius or Triton.");
}

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY environment variable is not set. Cannot perform a swap.");
}
// --- END CRITICAL CHECKS ---

// Establish connection to Solana Mainnet.
const connection = new Connection(RPC_URL, { commitment: "confirmed" });

// Get API key from environment variables (optional)
const apiKey = process.env.API_KEY;

// Create Jupiter API client with API key if available
const jupiterQuoteApi: JupiterQuoteApi = createJupiterApiClient(
  apiKey ? { apiKey } : undefined
);

// Log which API endpoint is being used for clarity
console.log("Using API endpoint:", apiKey
  ? "https://api.jup.ag/swap/v1 (Enterprise API)"
  : "https://lite-api.jup.ag/swap/v1 (Free Tier)");

/**
 * Retrieves a swap quote for a fixed SOL to USDC amount.
 */
async function getQuote(): Promise<QuoteResponse> {
  const params: QuoteGetRequest = {
    inputMint: "So11111111111111111111111111111111111111112", // SOL Mint Address
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC Mint Address
    amount: 100_000_000, // 0.1 SOL (100,000,000 Lamports)
    slippageBps: 100, // 1% Slippage
    onlyDirectRoutes: false,
    asLegacyTransaction: false, // Always prefer Versioned Transactions
  };

  // Get quote
  const quote = await jupiterQuoteApi.quoteGet(params);

  if (!quote) {
    throw new Error("Unable to get quote from Jupiter API.");
  }
  return quote;
}

/**
 * Requests the serialized transaction from Jupiter for the given quote.
 */
async function getSwapResponse(wallet: Wallet, quote: QuoteResponse): Promise<SwapResponse> {
  // Get serialized transaction with priority fee optimization
  const swapResponse = await jupiterQuoteApi.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      dynamicComputeUnitLimit: true, // Recommended: Adjusts CU limit dynamically
      dynamicSlippage: true,          // Recommended: Adjusts slippage based on market
      
      // Setting explicit high priority fee for quick transaction landing
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 10_000_000, // Max 0.01 SOL per transaction for priority fee
          priorityLevel: "veryHigh", 
        },
      },
    },
  });
  return swapResponse;
}

/**
 * Executes the quote flow and prints the result.
 */
async function flowQuote() {
  console.log("--- Starting Quote Flow (0.1 SOL -> USDC) ---");
  const quote = await getQuote();
  console.dir(quote, { depth: null });
  console.log("-------------------------------------------");
}

/**
 * Executes the full quote, swap, simulation, signing, and sending flow.
 */
async function flowQuoteAndSwap() {
  // Decode the wallet keypair securely
  const wallet = new Wallet(
    Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY))
  );
  const userPubKey = wallet.publicKey.toBase58();
  console.log("Wallet Public Key:", userPubKey);
  console.log("-------------------------------------------");

  const quote = await getQuote();
  console.log("Quote received successfully.");
  // console.dir(quote, { depth: null });

  const swapResponse = await getSwapResponse(wallet, quote);
  console.log("Swap transaction received from Jupiter.");
  // console.dir(swapResponse, { depth: null });

  // 1. Deserialize the transaction
  const swapTransactionBuf = Uint8Array.from(
    Buffer.from(swapResponse.swapTransaction, "base64")
  );
  // Transaction is expected to be VersionedTransaction
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  console.log("Transaction deserialized.");
  // 

  // 2. Sign the transaction
  transaction.sign([wallet.payer]);
  const signature = getSignature(transaction);
  console.log("Transaction signed. Signature:", signature);

  // 3. Simulate the transaction before sending (Best Practice)
  const { value: simulatedTransactionResponse } =
    await connection.simulateTransaction(transaction, {
      replaceRecentBlockhash: true,
      commitment: "processed",
    });
  const { err, logs } = simulatedTransactionResponse;

  if (err) {
    console.error("!!! FATAL: Transaction Simulation Error !!!");
    console.error("Simulation Error Details:", { err, logs });
    console.error("Reason: Ensure your wallet has sufficient SOL for fees and the input token (0.1 SOL) in the correct associated token account.");
    return;
  }
  console.log("Transaction simulation successful (no runtime errors).");

  // 4. Send and confirm the transaction
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

  // 5. Final Confirmation Check
  if (!transactionResponse) {
    console.error("!!! FATAL: Transaction not confirmed after waiting !!!");
    return;
  }

  if (transactionResponse.meta?.err) {
    console.error("!!! FATAL: Transaction confirmed with an error !!!");
    console.error(transactionResponse.meta.err);
    return;
  }

  console.log(`\n✅ Swap Successful!`);
  console.log(`Transaction Explorer Link: https://solscan.io/tx/${signature}`);
}

/**
 * Main entry point to handle environment variable flow control.
 */
export async function main() {
  const flow = process.env.FLOW;

  if (!flow) {
    console.error("Please set the FLOW environment variable (e.g., FLOW=quote or FLOW=quoteAndSwap)");
    return;
  }
  
  try {
    switch (flow) {
      case "quote": {
        await flowQuote();
        break;
      }
      case "quoteAndSwap": {
        await flowQuoteAndSwap();
        break;
      }
      default: {
        console.error(`Invalid FLOW environment variable: ${flow}. Must be 'quote' or 'quoteAndSwap'.`);
      }
    }
  } catch (error) {
    console.error("\n--- Application Error ---");
    console.error(error);
  }
}

main();
