import chokidar, { FSWatcher, WatchOptions } from "chokidar";
import { getConfig, IConfig } from "../config";
import Scene from "../types/scene";
import { basename, extname } from "path";
import * as logger from "../logger";
import ora = require("ora");
import { fileIsExcluded } from "../types/utility";

let videoFoldersWatcher: FSWatcher | null = null;

const unknownVideos = [] as string[];

/**
 * If we are currently importing a video
 */
let isImportingVideo = false;

let config: IConfig | null;

export async function watchVideoFolders(onReady) {
  config = getConfig();

  const videoWatchOptions: WatchOptions = {
    ignored: config.EXCLUDE_FILES,
    usePolling: true, // Necessary for network watching
    interval: 1000 * 2,
    awaitWriteFinish: true,
  };

  if (config.EXCLUDE_FILES.length)
    logger.log(`Will ignore files: ${config.EXCLUDE_FILES}.`);

  videoFoldersWatcher = chokidar.watch(config.VIDEO_PATHS, videoWatchOptions);

  videoFoldersWatcher.on("add", onVideoChildAdded);

  videoFoldersWatcher.on("ready", () => {
    logger.message("watcher is ready");
    onReady();
  });
}

async function onVideoChildAdded(path) {
  logger.log("[watch]: on add ", path);

  if (!config) {
    logger.log(
      "Expected config to be loaded but was not, cannot process new path"
    );
    return;
  }

  if (
    ![".mp4", ".webm"].includes(extname(path)) ||
    basename(path).startsWith(".") ||
    fileIsExcluded(config.EXCLUDE_FILES, path)
  ) {
    logger.log(`Ignoring file ${path}`);
    return;
  } else {
    logger.log(`Found matching file ${path}`);
    const existingScene = await Scene.getSceneByPath(path);
    logger.log(
      "[watch]: Scene with that path exists already ?: " + !!existingScene
    );

    if (existingScene) {
      return;
    } else {
      unknownVideos.push(path);
      processVideoPaths();
    }
  }
}

async function processVideoPaths() {
  if (isImportingVideo) {
    logger.log(
      "[watch]: Already processing a video, will not do this one right away"
    );
    return;
  }

  const videoPath = unknownVideos.shift();

  if (!videoPath) {
    logger.log("[watch]: No videos to process. Ending loop");
    isImportingVideo = false;
    return;
  }

  try {
    await Scene.onImport(videoPath);
  } catch (error) {
    logger.log(error.stack);
    logger.error("Error when importing " + videoPath);
    logger.warn(error.message);
  }

  isImportingVideo = false;

  processVideoPaths();
}
