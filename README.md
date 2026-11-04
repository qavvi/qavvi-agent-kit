# Qavvi Agent Kit

Connect your agent to Qavvi's service discovery, quotes and execution gateway.

[Website](https://qavvi.xyz) · [Documentation](docs/README.md) · [Client setup](docs/client-setup/README.md) · [Security](SECURITY.md)

## Quick start

Requires Node.js 22 or newer. Install from this repository; the package is not published to npm yet.

```sh
git clone https://github.com/qavvi/qavvi-agent-kit.git
cd qavvi-agent-kit
npm ci
node bin/qavvi.mjs search research
node bin/qavvi.mjs quote SERVICE_ID
```

For local MCP clients, run `node /absolute/path/qavvi-agent-kit/bin/qavvi.mjs mcp`. See [setup](docs/client-setup/README.md).

## What it does

- Discover callable services or include the broader catalogue.
- Inspect service details and review quotes before execution.
- Run supported services through Qavvi.
- Return x402 payment requirements without automatically paying.
- Publish and update provider configurations through the CLI.
- Sign and verify service manifests locally with ML-DSA-65.

A catalogue listing is not a promise that a service is callable. Provider results are untrusted data. Manifest signatures do not make wallets or network traffic quantum-safe.

## Repository map

| Directory | Purpose |
| --- | --- |
| `src/` | Gateway client and local stdio MCP server |
| `bin/` | CLI and local manifest signing |
| `docs/` | Architecture, API tools, access and client setup |
| `examples/` | Read-only discovery and quote examples |
| `plugins/` | Client configuration templates |
| `tests/` | Transport and MCP integration checks |
| `.github/workflows/` | Automated validation |

The website, registry, gateway, database and treasury stay in the separate [website repository](https://github.com/qavvi/website). This kit never receives the platform treasury key.

## Development

```sh
npm ci
npm run check
npm test
```

This repository starts from Qavvi's CLI at website commit `e9a244bde13f5c17143507aab0200f77c7ac511f`. The complete earlier project history remains in the website repository. No Oak source code is included.
