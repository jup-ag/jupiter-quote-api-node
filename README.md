# JavaScript API Client for Jupiter V6

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
  - [Using Custom URLs](#using-custom-urls)
  - [Paid Hosted APIs](#paid-hosted-apis)

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
    // platformFeeBps: 10,
    // asLegacyTransaction: true, // legacy transaction, default is versoined transaction
})
```

## Examples

Checkout the example in the repo. [link](/example/index.ts)

### Using Custom URLs

You can set custom URLs via the configuration for any self-hosted Jupiter APIs, like the [V6 Swap API](https://station.jup.ag/docs/apis/self-hosted) or the [paid hosted APIs](#paid-hosted-apis)

```typescript
import { createJupiterApiClient } from '@jup-ag/api';

const config = {
    basePath: 'https://hosted.api'
};
const jupiterQuoteApi = createJupiterApiClient(config);
```

### Paid Hosted APIs

You can also check out some of the [paid hosted APIs](https://station.jup.ag/docs/apis/self-hosted#paid-hosted-apis).