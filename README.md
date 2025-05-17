# JavaScript API Client for Jupiter V6

## Table of Contents

- [Installation](#installation)
- [Developing](#developing)
- [Usage](#usage)
- [Examples](#examples)
  - Paid Hosted APIs (Deprecated and will not be supported, reach out in Discord for more information)

## Installation

To use the Jupiter API client, you need to have Node.js and npm (Node Package Manager) installed. Then, you can install the package using npm:

```bash
npm install @jup-ag/api
```

## Developing

- pnpm dev-quote
  - Get request a quote based on mints and amount
- pnpm dev-swap
  - Post request with the quote response to receive the swap transaction to sign and send to the network
  - Ensure you have setup `process.env.PRIVATE_KEY` to sign
 
- Please set up `process.env.API_KEY` if you have a Pro plan via https://portal.jup.ag/

Refer to our developer documentation for more information and tips:
- Swap API: https://dev.jup.ag/docs/swap-api
- API Key setup: https://dev.jup.ag/docs/api-setup

## Usage

To start using the API client, you need to require it in your Node.js project:

```typescript
import { createJupiterApiClient } from '@jup-ag/api';

const jupiterQuoteApi = createJupiterApiClient(config); // config is optional such as api key
```

Now, you can call methods provided by the API client to interact with Jupiter's API. For example:

```typescript
jupiterQuoteApi.quoteGet({
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount: "100000000",
    slippageBps: 100,
})
```

## Examples

Checkout the [example in the repo](/example/index.ts).
