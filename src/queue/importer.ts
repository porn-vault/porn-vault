import { spawn } from "child_process";
import debounce from "lodash.debounce";

import { getConfig } from "../config";
import * as logger from "../logger";
import { checkImageFolders, checkVideoFolders } from "./check";
import LibraryWatcher from "./libraryWatcher";
import { getLength, isProcessing, setProcessingStatus } from "./processing";

let libraryWatcher: LibraryWatcher | null;
let scheduledScanTimeout: NodeJS.Timeout | null;

let isManualScanningLibrary = false;
let isProcessingLibrary = false;

export function getIsManualScanningLibrary() {
  return isManualScanningLibrary;
}

async function tryStartProcessing() {
  const queueLen = await getLength();
  if (queueLen > 0 && !isProcessing()) {
    logger.message("Starting processing worker...");
    setProcessingStatus(true);
    spawn(process.argv[0], process.argv.slice(1).concat(["--process-queue"]), {
      cwd: process.cwd(),
      detached: false,
      stdio: "inherit",
    }).on("exit", (code) => {
      logger.warn("Processing process exited with code " + code);
      setProcessingStatus(false);
    });
  } else if (!queueLen) {
    logger.success("No more videos to process.");
  }
}

async function processLibrary() {
  if (isProcessingLibrary) {
    logger.message("Is already processing library, will skip this one");
  }

  isProcessingLibrary = true;
  try {
    logger.message("Starting processing...");
    await tryStartProcessing();
    logger.message("Processing done");
  } catch (err) {
    logger.error("Couldn't start processing...");
    logger.error(err.message);
  }
  isProcessingLibrary = false;

  // When this round of processing is done, we assume
  // it's because the whole library is already scanned.
  // So only now, we can schedule another scan
  scheduleManualScan();
}

// Debounce the processing call to ensure that we only start processing
// once all videos are imported
export const debouncedProcessLibrary = debounce(processLibrary, 10 * 1000, {
  trailing: true,
});

/**
 * @param forceManualScan - if should scan via manual scan,
 * even if we are in watch mode
 */
export async function scanFolders(forceManualScan = false) {
  if (isManualScanningLibrary) {
    logger.message(
      "Received request to scan, but a scan is already in progress. Will skip this one"
    );
  }

  if (forceManualScan) {
    logger.message("Scheduled manual library scan starting...");
  } else {
    logger.message("Scanning library folders...");
  }

  const config = getConfig();

  if (!forceManualScan && config.WATCH_LIBRARY) {
    logger.message("Scanning library via file watching");

    if (libraryWatcher) {
      logger.message("Already watching library, will not recreate watcher");
    } else {
      libraryWatcher = new LibraryWatcher(debouncedProcessLibrary, () => {
        logger.message("Finished library watch initialization");
      });
    }

    return;
  }

  isManualScanningLibrary = true;

  logger.message("Scanning library via manual scan");

  // If we switched to manual scans: destroy the watcher
  if (libraryWatcher) {
    logger.message("File watcher was previously active, will destroy...");
    // Do not await
    libraryWatcher
      .stopWatching()
      .then(() => {
        libraryWatcher = null;
      })
      .catch((err) => {
        logger.error(
          "Error stopping file watch while switching to manual scan"
        );
        logger.error(err);
      });
  }

  try {
    logger.message("Launching manual video library scan");
    await checkVideoFolders();
    logger.success("Manual video library scan done.");
  } catch (err) {
    logger.error("Manual video library scan failed");
    logger.error(err);
  }

  // If the video import failed halfway through, we still want to
  // process the videos that did import
  logger.message("Will now start processing the imported videos");
  debouncedProcessLibrary(); // Do not await

  // Launch image import AFTER the video succeeds/fails
  try {
    logger.message("Launching manual image library scan");
    await checkImageFolders();
    logger.success("Manual image library scan done.");
  } catch (err) {
    logger.error("Manual image library scan failed");
    logger.error(err);
  }

  isManualScanningLibrary = false;
}

export function scheduleManualScan() {
  const config = getConfig();

  if (scheduledScanTimeout) {
    clearTimeout(scheduledScanTimeout);
    scheduledScanTimeout = null;
  }

  if (config.SCAN_INTERVAL > 0) {
    logger.message(`Setting up a manual scan in ${config.SCAN_INTERVAL}ms`);
    scheduledScanTimeout = setTimeout(
      () => scanFolders(true),
      config.SCAN_INTERVAL
    );
  }
}

export async function destroyImporter() {
  try {
    if (libraryWatcher) {
      logger.message("File watcher was previously active, will destroy...");

      await libraryWatcher.stopWatching();
    }
  } catch (err) {
    logger.error("Error cleaning up server resourced");
    logger.error(err);
  }
}
