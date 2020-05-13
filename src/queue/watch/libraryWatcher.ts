import { getConfig } from "../../config";
import * as logger from "../../logger";
import {
  LibraryTypes,
  LibraryTypesConfigPathsMapping,
  LibraryTypesExtensionMapping,
} from "../constants";
import { importPathsForLibraryType } from "../importManager";
import Watcher from "./watcher";

const libraryWatchers: { [key in LibraryTypes]: Watcher | null } = {
  [LibraryTypes.VIDEOS]: null,
  [LibraryTypes.IMAGES]: null,
};

/**
 * Generates an array of glob paths to watch for the library
 *
 * @param libraryType - the library type for which to create the globs
 */
const createWatchPaths = (libraryType: keyof typeof LibraryTypes) => {
  const config = getConfig();

  const paths =
    config[LibraryTypesConfigPathsMapping[LibraryTypes[libraryType]]];

  return paths.flatMap((path: string) =>
    LibraryTypesExtensionMapping[LibraryTypes[libraryType]].map(
      (extension: string) => `${path}/**/*${extension}`
    )
  );
};

/**
 * Initializes a watcher for all the library types in `LibraryTypes`
 */
export function initLibraryWatcher(
  libraryType: keyof typeof LibraryTypes,
  onInitialScanCompletedCb?: () => void
) {
  const config = getConfig();

  if (libraryWatchers[LibraryTypes[libraryType]]) {
    logger.message(
      `Already watching library type"${libraryType}", will not recreate watcher`
    );
    return;
  }

  const watchPaths = createWatchPaths(libraryType);

  const watcher = new Watcher(
    {
      includePaths: watchPaths,
      excludePaths: config.EXCLUDE_FILES,
      pollingInterval: config.WATCH_POLLING_INTERVAL,
    },
    (addedPath) => {
      logger.log(
        `[libraryWatcher]: for library type ${libraryType} found path ${addedPath}`
      );

      importPathsForLibraryType(
        <keyof typeof LibraryTypes>libraryType,
        addedPath
      );
    },
    () => {
      if (onInitialScanCompletedCb) {
        onInitialScanCompletedCb();
      }
    }
  );

  libraryWatchers[LibraryTypes[libraryType]] = watcher;
}
/**
 * Stops watching all for library watchers
 *
 * @returns resolves once all the files are unwatched
 */
export async function stopWatchingLibrary() {
  logger.log("[libraryWatcher]: Stopping watch for all library types");

  for (const type in LibraryTypes) {
    const libraryType = <keyof typeof LibraryTypes>type;
    await stopWatchingForLibraryType(libraryType);
  }
}

export async function stopWatchingForLibraryType(
  libraryType: keyof typeof LibraryTypes
) {
  const watcher = libraryWatchers[LibraryTypes[libraryType]];

  if (watcher) {
    await watcher.stopWatching();
    logger.log(
      `[libraryWatcher]: Did stop watching for library type ${libraryType}`
    );
    delete libraryWatchers[LibraryTypes[libraryType]];
  } else {
    logger.log(
      `[libraryWatcher]: Did not stop watching for library type ${libraryType}: was not watching`
    );
  }
}

/**
 * @returns if is watching at least one library type is being watched
 */
export function isWatchingAnyLibrary() {
  return Object.values(libraryWatchers).find((watcher) => !!watcher);
}

export function isWatchingLibraryType(libraryType: keyof typeof LibraryTypes) {
  return !!libraryWatchers[LibraryTypes[libraryType]];
}
