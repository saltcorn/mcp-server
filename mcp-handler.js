const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { loadToolsFromAgents } = require("./tools/from-agents");

/**
 * Creates a stateless MCP server. 
 * Registers handlers for listing and calling tools.
 * @param {object} req
 * @returns {Server}
 */
const createServer = (req) => {
  const server = new Server(
    { name: "saltcorn", version: require("./package.json").version },
    { capabilities: { tools: {} } }
  );

  // list request handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await loadToolsFromAgents(req);
    return { tools: tools.map((t) => t.toolDef) };
  });

  // call request handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tools = await loadToolsFromAgents(req);
    const tool = tools.find((t) => t.toolDef.name === name);

    if (!tool)
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
      };

    try {
      const result = await tool.process(args);
      return {
        content: [
          {
            type: "text",
            text: result !== undefined ? JSON.stringify(result) : "ok",
          },
        ],
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: e.message || String(e) }],
      };
    }
  });

  return server;
};

/**
 * Express route handler for GET /mcp and POST /mcp. Creates a fresh server and
 * transport per request and delegates to the MCP SDK.
 * @param {object} req
 * @param {object} res
 */
const mcpHandler = async (req, res) => {
  try {
    const server = createServer(req);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error("MCP handler error", e);
    if (!res.headersSent)
      res.status(500).json({ error: e.message || "MCP server error" });
  }
};

module.exports = { mcpHandler };
