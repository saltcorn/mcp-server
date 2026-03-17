# mcp-server

Expose Agent triggers as MCP tools callable by any AI client.

Requires the [agents](https://github.com/saltcorn/agents) plugin.

## How it works

Agent triggers with `when_trigger` set to **API call** are exposed as MCP tools. This is required because only API call triggers have a **Minimum role** setting, which controls which users can see and invoke the tool.

## Endpoint

```
POST /mcp
GET  /mcp
```

The endpoint is stateless and uses the [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http) MCP transport.

## Authentication

Requests must include a valid API token as a bearer token:

```
Authorization: Bearer <your-api-token>
```
