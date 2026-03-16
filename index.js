const { mcpHandler } = require("./mcp-handler");

module.exports = {
  sc_plugin_api_version: 1,
  plugin_name: "mcp-server",
  dependencies: ["@saltcorn/agents"],
  routes: [
    {
      url: "/mcp",
      method: "post",
      noCsrf: true,
      apiToken: true,
      callback: mcpHandler,
    },
    {
      url: "/mcp",
      method: "get",
      noCsrf: true,
      apiToken: true,
      callback: mcpHandler,
    },
  ],
};
