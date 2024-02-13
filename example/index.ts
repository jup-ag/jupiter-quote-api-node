import { createJupiterApiClient, IndexedRouteMapResponse } from "../src/index";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";

export async function main() {
  const jupiterQuoteApi = createJupiterApiClient();
  const wallet = new Wallet(
    Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || ""))
  );

  // make sure that you are using your own RPC endpoint
  const connection = new Connection(
    "https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/"
  );

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
      userPublicKey: wallet.publicKey.toBase58(),
      dynamicComputeUnitLimit: true,
    },
  });

  console.dir(swapResult, { depth: null });

  // submit transaction
  const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, "base64");
  var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  console.log(transaction);

  // sign the transaction
  transaction.sign([wallet.payer]);

  const rawTransaction = transaction.serialize();
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2,
  });
  await connection.confirmTransaction(txid);
  console.log(`https://solscan.io/tx/${txid}`);

  // get route map
  const tokens = await jupiterQuoteApi.tokensGet();
  console.log(Object.keys(tokens).length);
}

main();
