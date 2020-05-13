import { queue } from "async";
import Jimp from "jimp";
import { basename, extname } from "path";

import { getConfig } from "../config";
import { imageCollection } from "../database";
import { extractActors, extractLabels, extractScenes } from "../extractor";
import * as logger from "../logger";
import { indexImages } from "../search/image";
import Image from "../types/image";
import {
  LibraryTypeQueueManager,
  SUPPORTED_IMAGE_EXTENSIONS,
} from "./constants";
import { fileIsExcluded } from "./utility";

function isImportableImage(path) {
  const config = getConfig();

  return (
    SUPPORTED_IMAGE_EXTENSIONS.includes(extname(path)) &&
    !basename(path).startsWith(".") &&
    !fileIsExcluded(config.EXCLUDE_FILES, path)
  );
}

async function processImage(imagePath: string, readImage = true) {
  try {
    const imageName = basename(imagePath);
    const image = new Image(imageName);
    image.path = imagePath;

    if (readImage) {
      const jimpImage = await Jimp.read(imagePath);
      image.meta.dimensions.width = jimpImage.bitmap.width;
      image.meta.dimensions.height = jimpImage.bitmap.height;
      image.hash = jimpImage.hash();
    }

    // Extract scene
    const extractedScenes = await extractScenes(imagePath);
    logger.log(`Found ${extractedScenes.length} scenes in image path.`);
    image.scene = extractedScenes[0] || null;

    // Extract actors
    const extractedActors = await extractActors(imagePath);
    logger.log(`Found ${extractedActors.length} actors in image path.`);
    await Image.setActors(image, [...new Set(extractedActors)]);

    // Extract labels
    const extractedLabels = await extractLabels(imagePath);
    logger.log(`Found ${extractedLabels.length} labels in image path.`);
    await Image.setLabels(image, [...new Set(extractedLabels)]);

    // await database.insert(database.store.images, image);
    await imageCollection.upsert(image._id, image);
    await indexImages([image]);
    logger.success(`Image '${imageName}' done.`);
  } catch (error) {
    logger.error(error);
    logger.error(`Failed to add image '${imagePath}'.`);
  }
}

const onImageQueueEmptiedListeners: (() => void)[] = [];

function attachOnImageQueueEmptiedListener(fn: () => void) {
  onImageQueueEmptiedListeners.push(fn);
}

// QUEUE EXECUTION

const imageProcessingQueue = queue(importImageFromPath, 1);
imageProcessingQueue.drain(onImportQueueEmptied);
imageProcessingQueue.error(onImportQueueError);

/**
 * Processes a path in the queue by importing the image
 *
 * @param path - the path to process
 * @param callback - callback to execute once the path is processed
 */
async function importImageFromPath(imagePath: string, callback: () => void) {
  try {
    const existingImage = await await Image.getImageByPath(imagePath);
    logger.log(
      `[imageQueue]: Path ${imagePath} exists already ?: ${!!existingImage}`
    );

    if (!existingImage) {
      logger.log(
        `[imageQueue]: No existing image, will import '${imagePath}'.`
      );

      const config = getConfig();
      await processImage(imagePath, config.READ_IMAGES_ON_IMPORT);
    }
  } catch (error) {
    logger.log(error.stack);
    logger.error("[imageQueue]: Error when importing " + imagePath);
    logger.warn(error.message);
  }

  callback();
}

function onImportQueueEmptied() {
  logger.log("[imageQueue]: Import processing queue empty");

  for (const listener of onImageQueueEmptiedListeners) {
    listener();
  }
}

function onImportQueueError(error: Error, task: string) {
  logger.error("[imageQueue]: Path import processing encountered an error");
  logger.error(error);
}

// QUEUE MANAGEMENT

/**
 * Handles a new path in the image folders.
 * If it is a supported image, adds it to the processing queue
 *
 * @param path - the path newly added to the watch image
 * folders
 */
async function addImagePathsToQueue(...paths: string[]) {
  for (const path of paths) {
    if (isImportableImage(path)) {
      logger.log(
        `[imageQueue]: Found matching file ${path}, adding to import queue`
      );
      imageProcessingQueue.push(path);
    } else {
      logger.log(`[imageQueue]: Ignoring file ${path}`);
    }
  }
}

export const ImageImportQueueManager: LibraryTypeQueueManager = {
  attachOnQueueEmptiedListener: attachOnImageQueueEmptiedListener,
  addPathsToQueue: addImagePathsToQueue,
  getQueueLength: () => imageProcessingQueue.length(),
  resumeQueue: () => imageProcessingQueue.resume(),
  pauseQueue: () => imageProcessingQueue.pause(),
  getRunningCount: () => imageProcessingQueue.running(),
  isQueueRunning: () => imageProcessingQueue.running() > 0,
};
