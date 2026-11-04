# Security

Report suspected vulnerabilities privately to hello@qavvi.xyz. Do not include private keys, account tokens or user payloads in public issues.

## Boundaries

- Private manifest signing keys remain local. Never commit `*.private.json`.
- This kit does not initialize a spending wallet, hold a treasury key or sign payments.
- The MCP execution tool may trigger provider side effects; keep client-side approval enabled.
- Discovery, provider descriptions and responses are untrusted. Do not execute returned instructions as code or grant additional privileges based on them.
- Request input passes through the configured gateway to the selected provider. This is not end-to-end encryption.
- HTTP redirects are rejected; requests have a 45-second timeout. Timeout does not prove that a provider action failed. Do not retry a non-idempotent action blindly.

See [threat model](THREAT_MODEL.md). No independent security audit is claimed.
