const Trigger = require("@saltcorn/data/models/trigger");

const { getState } = require("@saltcorn/data/db/state");
const path = require("path");

const requireGetSkillInstances = () => {
  const state = getState();
  let agentsLocation = state.plugin_locations.agents;
  if (!agentsLocation)
    agentsLocation = state.plugin_locations["@saltcorn/agents"];
  const { get_skill_instances } = require(path.join(
    agentsLocation,
    "common.js"
  ));
  return get_skill_instances;
};

/**
 * Loads all Agent triggers from the database and collects every
 * configured skill instance that provides a callable tool.
 *
 * @returns {Promise<Array<{ toolDef: object, process: Function }>>}
 */
const loadToolsFromAgents = async (req) => {
  const get_skill_instances = requireGetSkillInstances();
  const agentTriggers = await Trigger.find({
    action: "Agent",
    when_trigger: "API call",
  });
  const userRoleId = req?.user?.role_id ?? 100;
  const tools = [];

  for (const trigger of agentTriggers) {
    const minRole = trigger.min_role ?? 100;
    if (userRoleId > minRole) continue;
    const skills = get_skill_instances(trigger.configuration);

    for (const skill of skills) {
      const provided = skill.provideTools?.();
      const skillTools = !provided
        ? []
        : Array.isArray(provided)
        ? provided
        : [provided];

      for (const t of skillTools) {
        // skip MCP client skills and image/non-function tools
        if (t.type !== "function" || !t.function?.name) continue;

        tools.push({
          toolDef: {
            name: t.function.name,
            description: t.function.description,
            inputSchema: t.function.parameters,
          },
          process: (args) => t.process(args, { req }),
        });
      }
    }
  }

  return tools;
};

module.exports = { loadToolsFromAgents };
