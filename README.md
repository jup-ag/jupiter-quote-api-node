# JavaScript API Client for Jupiter V6

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
  - [Paid Hosted APIs](#paid-hosted-apis) (Deprecated and will not be supported, reach out in Discord for more information)

## Installation

To use the Jupiter API client, you need to have Node.js and npm (Node Package Manager) installed. Then, you can install the package using npm:

```bash
npm install @jup-ag/api
```

## Developing

- pnpm dev-quote
  - just get a quote, without needing wallet
- pnpm dev-swap
  - get a quote, perform swap
  - please setup `process.env.PRIVATE_KEY`

Refer to Station developer documentation for more inforamtion and tips: https://station.jup.ag/docs/

## Usage

To start using the API client, you need to require it in your Node.js project:

```typescript
import { createJupiterApiClient } from '@jup-ag/api';

const jupiterQuoteApi = createJupiterApiClient(config); // config is optional

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
