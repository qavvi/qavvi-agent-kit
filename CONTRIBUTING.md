# Contributing

Use Node.js 22+, run `npm ci`, `npm run check` and `npm test`. Keep provider integrations behind the hosted gateway contract; do not hardcode a duplicate catalogue here.

Add tests for transport errors and payment boundaries. Keep stdout reserved for MCP protocol messages. Never add credentials, private research, user payloads or production wallet fixtures. Open a focused pull request explaining behavior and validation.
