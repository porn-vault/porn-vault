import Actor from "../types/actor";
import { runPluginsSerial } from "../plugins";
import { mapAsync } from "../types/utility";
import { extractLabels } from "../extractor";
import { getConfig } from "../config";

// This function has side effects
export async function onActorCreate(actor: Actor, actorLabels: string[]) {
  const config = getConfig();

  const pluginResult = await runPluginsSerial(config, "actorCreated", {
    actorName: actor.name
  });

  if (typeof pluginResult.name === "string") actor.name = pluginResult.name;

  if (typeof pluginResult.releaseDate === "number")
    actor.bornOn = new Date(pluginResult.bornOn).valueOf();

  if (pluginResult.aliases && Array.isArray(pluginResult.aliases)) {
    actor.aliases.push(...pluginResult.aliases);
    actor.aliases = [...new Set(actor.aliases)];
  }

  if (pluginResult.custom && typeof pluginResult.custom === "object")
    Object.assign(actor.customFields, pluginResult.custom);

  if (pluginResult.labels && Array.isArray(pluginResult.labels)) {
    const labelIds = (
      await mapAsync(pluginResult.labels, extractLabels)
    ).flat();
    await Actor.setLabels(actor, labelIds.concat(actorLabels));
  }

  return actor;
}
