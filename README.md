# mcp-server

Expose Agent triggers as MCP tools callable by any AI client.

Requires the [agents](https://github.com/saltcorn/agents) plugin.

## How it works

Each Agent trigger you configure becomes an MCP tool. Any MCP-compatible client can then discover and call them via the `/mcp` endpoint.

## Endpoint

```
POST /mcp
GET  /mcp
```

The endpoint is stateless and uses the [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http) MCP transport.
