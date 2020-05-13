import { queue } from "async";
import { basename, extname } from "path";

import { getConfig } from "../config";
import * as logger from "../logger";
import Scene from "../types/scene";
import {
  LibraryTypeQueueManager,
  SUPPORTED_VIDEO_EXTENSIONS,
} from "./constants";
import { fileIsExcluded } from "./utility";

function isImportableVideo(path) {
  const config = getConfig();

  return (
    SUPPORTED_VIDEO_EXTENSIONS.includes(extname(path)) &&
    !basename(path).startsWith(".") &&
    !fileIsExcluded(config.EXCLUDE_FILES, path)
  );
}

const onVideoQueueEmptiedListeners: (() => void)[] = [];

export function attachOnVideoQueueEmptiedListener(fn: () => void) {
  onVideoQueueEmptiedListeners.push(fn);
}

// QUEUE EXECUTION

const videoProcessingQueue = queue(importVideoFromPath, 1);
videoProcessingQueue.drain(onImportQueueEmptied);
videoProcessingQueue.error(onImportQueueError);

// The video queue should be paused by default
// because we only want to start it once all paths have
// been discovered
videoProcessingQueue.pause();

/**
 * Processes a path in the queue by importing the scene
 *
 * @param path - the path to process
 * @param callback - callback to execute once the path is processed
 */
async function importVideoFromPath(path: string, callback: () => void) {
  try {
    const existingScene = await Scene.getSceneByPath(path);
    logger.log(
      `[videoQueue]: Path ${path} exists already ?: ${!!existingScene}`
    );

    if (!existingScene) {
      logger.log(
        `[videoQueue]: No existing scene, will import video '${path}'.`
      );
      await Scene.onImport(path);
    }
  } catch (error) {
    logger.log(error.stack);
    logger.error("[videoQueue]:Error when importing " + path);
    logger.warn(error.message);
  }

  callback();
}

function onImportQueueEmptied() {
  logger.log("[videoQueue]: Import processing queue empty");

  for (const listener of onVideoQueueEmptiedListeners) {
    listener();
  }
}

function onImportQueueError(error: Error, task: string) {
  logger.error("[videoQueue]: Path import processing encountered an error");
  logger.error(error);
}

// QUEUE MANAGEMENT

/**
 * Handles a new path in the video folders.
 * If it is a supported video, adds it to the processing queue
 *
 * @param path - the path newly added to the watch video
 * folders
 */
export async function addVideoPathToQueue(...paths: string[]) {
  for (const path of paths) {
    if (isImportableVideo(path)) {
      logger.log(
        `[videoQueue]: Found matching file ${path}, adding to import queue`
      );

      videoProcessingQueue.push(path);
    } else {
      logger.log(`[videoQueue]: Ignoring file ${path}`);
    }
  }
}

export const VideoImportQueueManager: LibraryTypeQueueManager = {
  attachOnQueueEmptiedListener: attachOnVideoQueueEmptiedListener,
  addPathsToQueue: addVideoPathToQueue,
  getQueueLength: () => videoProcessingQueue.length(),
  resumeQueue: () => videoProcessingQueue.resume(),
  pauseQueue: () => videoProcessingQueue.pause(),
  getRunningCount: () => videoProcessingQueue.running(),
  isQueueRunning: () => videoProcessingQueue.running() > 0,
};
