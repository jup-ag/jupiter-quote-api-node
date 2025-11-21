import bs58 from "bs58";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

/**
 * @notice Extracts the primary signature (which acts as the transaction ID) from a Solana transaction object
 * and encodes it into the Base58 string format.
 * @param transaction The Solana Transaction (legacy) or VersionedTransaction object.
 * @returns The Base58-encoded transaction signature string.
 * @throws Error if the transaction does not contain a signature (meaning it wasn't signed by the fee payer).
 */
export function getSignature(
  transaction: Transaction | VersionedTransaction
): string {
  // Use a type guard to correctly access the signature based on the transaction type.
  // For VersionedTransaction, the first signature in the array is the fee payer's signature (the Tx ID).
  // For the legacy Transaction type, the signature field is used.
  const rawSignature: Buffer | Uint8Array | null | undefined =
    'signature' in transaction 
      ? transaction.signature
      : transaction.signatures[0];

  // The signature must be present for a transaction to have an ID.
  if (!rawSignature) {
    throw new Error(
      "Missing transaction signature; the transaction was not signed by the fee payer."
    );
  }

  // Ensure the signature is encoded correctly from its raw byte format.
  // We use the 'rawSignature' variable directly for bs58.encode.
  return bs58.encode(rawSignature);
}
