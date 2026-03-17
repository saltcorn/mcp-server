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
  const agentTriggers = Trigger.find({
    action: "Agent",
    when_trigger: "API call",
  }).sort((a, b) => a.id - b.id);
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

  // detect name collisions and suffix duplicates with _01, _02, ...
  const nameCounts = {};
  for (const tool of tools)
    nameCounts[tool.toolDef.name] = (nameCounts[tool.toolDef.name] || 0) + 1;

  const nameCounters = {};
  for (const tool of tools) {
    const base = tool.toolDef.name;
    if (nameCounts[base] > 1) {
      nameCounters[base] = (nameCounters[base] || 0) + 1;
      tool.toolDef.name = `${base}_${String(nameCounters[base]).padStart(2, "0")}`;
    }
  }

  return tools;
};

module.exports = { loadToolsFromAgents };
