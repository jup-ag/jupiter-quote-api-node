# JavaScript API Client for Jupiter V6

## Table of Contents

- [Installation](#installation)
- [Developing](#developing)
- [Usage](#usage)

## Installation

Install the package:

```bash
bun add @jup-ag/api
```

## Usage

```ts
import { JupiterApi } from "@jup-ag/api";

const jupiter = new JupiterApi({
  apiKey: process.env.JUPITER_API_KEY,
});

const order = await jupiter.swap.v2.getOrder({
  inputMint: "So11111111111111111111111111111111111111112",
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "1000000",
  slippageBps: 100,
});
```
