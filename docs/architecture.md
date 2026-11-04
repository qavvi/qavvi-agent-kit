# Architecture

The local kit contains the CLI, service-manifest signing utilities, reusable HTTP client and stdio MCP bridge. The website repository contains the hosted registry, gateway, provider workspace, database and treasury operations.

Both browser and kit consume the hosted discovery, inspection, quote and call API. The kit does not duplicate the service catalogue. HTTP requests reject redirects and time out after 45 seconds; a timeout never implies an action can safely be retried.

## Implemented

- Local stdio MCP discovery, inspection, quote and execution tools.
- Structured handling of non-JSON gateway errors and HTTP 402 challenges.
- CLI publishing with an owner session token and optional externally authorized payment payloads.
- Local ML-DSA-65 service-manifest signatures.

## Still to build

Local wallet signing, payment review bound to exact request and recipient, a durable receipt ledger, reconciliation and bounded spending policies. No automatic payment negotiation, refunds or Private Mode are claimed.

## Source and history

The CLI was extracted from Qavvi website release e9a244bde13f5c17143507aab0200f77c7ac511f. The full historical commits remain in qavvi/website. The kit has a separate history beginning with this extraction; original authors and dates are not rewritten. No Oak implementation code was copied.

The npm package is private pending a separate package release decision. GitHub publication does not publish an npm package or change production deployment routing.
