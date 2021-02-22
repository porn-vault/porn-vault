import { copyFile, mkdir, mkdirSync, readdir, readFile, rmdir, stat, unlink, writeFile } from "fs";
import { basename, join, resolve } from "path";
import { promisify } from "util";

import { handleError, logger } from "../logger";
import { getExtension } from "../string";

export const statAsync = promisify(stat);
export const unlinkAsync = promisify(unlink);
export const readdirAsync = promisify(readdir);
export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);
export const copyFileAsync = promisify(copyFile);
export const rmdirAsync = promisify(rmdir);
export const mkdirAsync = promisify(mkdir);
export function rimrafAsync(path: string): Promise<void> {
  return rmdirAsync(path, { recursive: true });
}
export function mkdirpSync(path: string): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return mkdirSync(path, { recursive: true })!;
}

const pathIsExcluded = (exclude: string[], path: string) =>
  exclude.some((regStr) => new RegExp(regStr, "i").test(path.toLowerCase()));

const validExtension = (exts: string[], path: string) =>
  exts.includes(getExtension(path).toLowerCase());

export interface IWalkOptions {
  dir: string;
  extensions: string[];
  /**
   * Return a truthy value to stop the walk. The return value will be the
   * path passed to the callback.
   */
  cb: (file: string) => void | Promise<void | unknown> | unknown;
  exclude: string[];
}

/**
 * If the callback returns a truthy value, the walk will be stopped
 * and the value will be returned. Otherwise, the full stack will be walked
 *
 * @param options - walk options
 * @returns the first path where a truthy value was returned by the callback, or void
 */
export async function walk(options: IWalkOptions): Promise<void | string> {
  const root = resolve(options.dir);

  const folderStack = [] as string[];
  folderStack.push(root);

  while (folderStack.length) {
    const top = folderStack.pop();
    if (!top) {
      break;
    }

    logger.debug(`Walking folder ${top}`);
    let filesInDir: string[] = [];

    try {
      filesInDir = await readdirAsync(top);
    } catch (err) {
      logger.error(`Error reading contents of directory "${top}", skipping`);
      logger.error(err);
      continue;
    }

    for (const file of filesInDir) {
      const path = join(top, file);

      if (pathIsExcluded(options.exclude, path) || basename(path).startsWith(".")) {
        logger.debug(`"${path}" is excluded, skipping`);
        continue;
      }

      try {
        const stat = await statAsync(path);
        if (stat.isDirectory()) {
          logger.debug(`Pushed folder ${path}`);
          folderStack.push(path);
        } else if (validExtension(options.extensions, file)) {
          logger.debug(`Found file ${file}`);
          const resolvedPath = resolve(path);
          const res = await options.cb(resolvedPath);
          if (res) {
            return resolvedPath;
          }
        }
      } catch (err) {
        const _err = err as Error & { code: string };
        // Check if error was an fs permission error
        if (_err.code && (_err.code === "EACCES" || _err.code === "EPERM")) {
          logger.error(`"${path}" requires elevated permissions, skipping`);
        } else {
          handleError(`Error walking or in callback for "${path}", skipping`, err);
        }
      }
    }
  }
}
