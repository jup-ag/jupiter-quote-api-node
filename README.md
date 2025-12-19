Jupiter V6 JavaScript API Client

A robust client library for interacting with the Jupiter Swap API (V6). Use this package to easily fetch quotes and build swap transactions on the Solana network.

Table of Contents

Prerequisites

Installation

Configuration and Authentication

Usage

Initialization

Getting a Quote

Executing a Swap

Local Development

Resources

Prerequisites

To use this client, ensure you have the following installed:

Node.js (v18 or higher recommended)

npm or pnpm (Node Package Manager)

Installation

Install the package via npm or pnpm:

npm install @jup-ag/api
# or
pnpm install @jup-ag/api


Configuration and Authentication

For production use and premium features, setting up environment variables is required.

API Key (Pro Plan Access)

If you are on a Pro plan, you must set your API key to access rate-limited or premium endpoints:

# In your .env file or environment
export API_KEY="YOUR_JUPITER_PRO_API_KEY"


The client will automatically pick up process.env.API_KEY during initialization if passed without a specific configuration object.

Private Key (For Swap Execution)

To sign and execute a swap transaction, you must provide your wallet's private key. This is typically used in the backend for the dev-swap script:

# In your .env file or environment
export PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"


Usage

Initialization

Import the client factory and create an instance. The config object is optional, primarily for passing the API key or custom fetch configurations.

import { createJupiterApiClient } from '@jup-ag/api';

// Configuration is optional, the client will look for process.env.API_KEY automatically
// if you are using Pro features.
const jupiterQuoteApi = createJupiterApiClient(/* config */);


Getting a Quote

Use the quoteGet method to fetch the best route for a swap.

Important Note on Amount: The amount field must be specified in the smallest unit (Lamports) of the input token. For example, to swap 0.1 SOL, which has 9 decimal places, the amount should be 100000000.

jupiterQuoteApi.quoteGet({
    // Standard Solana WSOL address
    inputMint: "So11111111111111111111111111111111111111112", 
    // USDC (Example)
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    // Example: 0.1 SOL (100,000,000 Lamports)
    amount: "100000000",
    // Slippage tolerance in basis points (100 BPS = 1%)
    slippageBps: 100,
});


Executing a Swap

The swap process is two-fold:

Get Quote: Call jupiterQuoteApi.quoteGet to receive a QuoteResponse object.

Get Swap Transaction: Pass the entire QuoteResponse object to the swapPost method. This returns a serialized transaction that needs to be signed and sent to the network.

// Assumes 'quoteResponse' is the result from jupiterQuoteApi.quoteGet
const swapTransaction = await jupiterQuoteApi.swapPost({
    swapRequest: quoteResponse
});

// The returned transaction must be signed and broadcasted to the Solana network.
// Ensure process.env.PRIVATE_KEY is set for local testing/development.


Local Development

The following pnpm scripts are available for testing the client functionality locally:

Script

Method

Description

Requirements

pnpm dev-quote

GET /quote

Fetches and displays the best swap quote for pre-configured mints and amounts.

None

pnpm dev-swap

POST /swap

Executes a swap transaction based on a retrieved quote.

process.env.PRIVATE_KEY must be set for signing.

Resources

Jupiter Developer Documentation: https://dev.jup.ag/docs

Swap API Reference: https://dev.jup.ag/docs/swap-api

API Key Setup Guide: https://dev.jup.ag/docs/api-setup

Example Code: Check out the comprehensive example in the repository: example/index.ts

A Note on Deprecated APIs: The previously supported Paid Hosted APIs are no longer actively maintained. For any inquiries regarding paid or enterprise usage, please reach out via the official Jupiter Discord channel.
