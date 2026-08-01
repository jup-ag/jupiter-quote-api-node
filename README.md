# Jupiter API Client

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Developing](#developing)

## Installation

Install the package:

```bash
bun add @jup-ag/api
```

## Usage

```ts
import { JupiterApi } from "@jup-ag/api";

const jupiter = new JupiterApi({
  apiKey: "your-jupiter-api-key",
});

const order = await jupiter.swap.v2.getOrder({
  inputMint: "So11111111111111111111111111111111111111112",
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "1000000",
  slippageBps: 100,
});
```

## Developing

This repository uses Bun. Install its dependencies with:

```bash
bun install
```

### OpenAPI generation

The version-controlled source specifications live under `openapi/`, preserving
their Jupiter product and version directory structure. `openapi/jupiter.yaml` is
the derived composite input consumed by the TypeScript generator. Upstream
specification updates are copied into this directory and reviewed here.

To add a new OpenAPI specification to the client:

1. Add the source YAML under `openapi/`, using its natural product/version path.
2. Run `bun run prepare-openapi`. It discovers every source YAML, derives its
   normalized tag from the path, and refreshes `openapi/jupiter.yaml`.
3. Add the corresponding service key and default URL to
   `src/client/config.ts`, then expose its generated API from
   `src/client/JupiterApi.ts` in the same nested structure as `openapi/`.
4. Run `bun run generate` to rebuild the composite specification and the typed
   client under `generated/`.
5. Run the validation commands below before committing the change.

Use these commands during development:

```bash
# Refresh only the composite root specification.
bun run prepare-openapi

# Generate from the existing composite root.
bun run openapi-gen

# Clean generated output, prepare the root, and generate the client.
bun run generate

# Apply lint fixes and verify formatting.
bun run lint
bun run format:check

# Regenerate and compile the published ESM, CJS, and declaration output.
bun run build
```

### Releases

For a user-facing change, run `bun run changeset` and record the appropriate
version bump. After the change is merged, CI creates or updates a release PR.
Merge that PR, then tag the resulting version to trigger trusted publication.
