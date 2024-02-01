# JavaScript API Client for Jupiter V6

## Table of Contents

- [JavaScript API Client for Jupiter V6](#javascript-api-client-for-jupiter-v6)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Examples](#examples)
    - [Using custom URLs](#using-custom-urls)

## Installation

To use the Jupiter API client, you need to have Node.js and npm (Node Package Manager) installed. Then, you can install the package using npm:

```bash
npm install @jup-ag/api
```

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

### Using custom URLs

You can set custom URLs via the configuration for any self-hosted Jupiter APIs, like the [V6 Swap API](https://station.jup.ag/docs/apis/self-hosted) or [QuickNode's Metis API](https://marketplace.quicknode.com/add-on/metis-jupiter-v6-swap-api). Here is an example

```typescript
import { createJupiterApiClient } from '@jup-ag/api';

const config = {
    basePath: 'https://jupiter-swaps.quiknode.pro/D3ADB33F'
};
const jupiterQuoteApi = createJupiterApiClient(config);

```