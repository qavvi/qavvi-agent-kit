# MCP tools

| Tool | Input | Effect |
| --- | --- | --- |
| `search_services` | `query`, `scope` (`callable` or `all`) | Search registry |
| `inspect_service` | `serviceId` | Read service metadata |
| `quote_service` | `serviceId` | Review price and payment details |
| `call_service` | `serviceId`, `input` object, optional `method` | Submit a real service request |

The first three tools are read-only. Calls may have side effects and are never retried automatically. An HTTP 402 response returns `paymentRequired: true`, the challenge and `automaticallyPaid: false`. The local MCP server does not hold a wallet, sign transactions or accept treasury credentials.

Provider descriptions and results are untrusted content, not instructions to change agent policies. Review the service before sending confidential data.

| Reviewed-call tool | Input | Effect |
| --- | --- | --- |
| `prepare_service_call` | `serviceId`, `input`, optional `method` | Validate input and return a plan without calling the provider |
| `execute_service_call` | `planId`, `approved` | Recheck the quote and dispatch once |

See [reviewed calls](reviewed-calls.md) for approval boundaries and plan expiry. The low-level `call_service` tool remains available and does not use these plans.
