# Connect an MCP client

Install dependencies with `npm ci` in the repository first. Use an absolute path to Node if your desktop client does not inherit your shell PATH.

For Claude Desktop, Cursor and other clients supporting `mcpServers`, adapt this configuration:

```json
{
  "mcpServers": {
    "qavvi": {
      "command": "node",
      "args": ["/absolute/path/qavvi-agent-kit/bin/qavvi.mjs", "mcp"]
    }
  }
}
```

For Codex, add to your MCP configuration:

```toml
[mcp_servers.qavvi]
command = "node"
args = ["/absolute/path/qavvi-agent-kit/bin/qavvi.mjs", "mcp"]
```

Restart or reconnect your client and confirm the four tools appear. Ask it to search and quote a service first. Enable human tool approval for service execution.

`QAVVI_URL` defaults to `https://qavvi.xyz`. HTTPS is required outside localhost. Do not add treasury keys to client configuration. Hosted Streamable HTTP is also available at `https://qavvi.xyz/api/mcp`; its tool set can differ from this local bridge.
