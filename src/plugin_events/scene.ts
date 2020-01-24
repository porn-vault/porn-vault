import Scene from "../types/scene";
import { runPluginsSerial } from "../plugins";
import { mapAsync } from "../types/utility";
import { extractLabels } from "../extractor";
import { getConfig } from "../config";

// This function has side effects
export async function onSceneCreate(scene: Scene, sceneLabels: string[]) {
  const config = getConfig();

  const pluginResult = await runPluginsSerial(config, "sceneCreated", {
    sceneName: scene.name,
    scenePath: scene.path
  });

  if (typeof pluginResult.name === "string") scene.name = pluginResult.name;

  if (typeof pluginResult.description === "string")
    scene.description = pluginResult.description;

  if (typeof pluginResult.releaseDate === "number")
    scene.releaseDate = new Date(pluginResult.releaseDate).valueOf();

  if (pluginResult.custom && typeof pluginResult.custom === "object")
    Object.assign(scene.customFields, pluginResult.custom);

  if (pluginResult.labels && Array.isArray(pluginResult.labels)) {
    const labelIds = (
      await mapAsync(pluginResult.labels, extractLabels)
    ).flat();
    await Scene.setLabels(scene, labelIds.concat(sceneLabels));
  }

  return scene;
}
