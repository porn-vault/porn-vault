import { getConfig } from "../config";
import { walk, existsAsync, readFileAsync, writeFileAsync } from "../fs/async";
import { basename, extname } from "path";
import * as logger from "../logger/index";
import { libraryPath, Dictionary } from "../types/utility";
import YAML from "yaml";
import {
  readScenes,
  IImportedLabel,
  IImportedScene,
  IImportedActor,
  IImportedMovie,
  readActors,
  readLabels,
  readMovies
} from "./read";
import { verifyFileData } from "./verify";
import { createFromFileData } from "./create";

// Previously imported files
let imported: string[] = [];

async function processFile(file: string) {
  let parsed = null as any;

  let fileContent = await readFileAsync(file, "utf-8");

  if (extname(file) == ".json") parsed = JSON.parse(fileContent);
  else if (extname(file) == ".yaml") parsed = YAML.parse(fileContent);
  else throw new Error(`Unsupported file type '${extname(file)}'.`);

  if (typeof parsed !== "object" || parsed === null)
    throw new Error(`Invalid format.`);

  let scenes = {} as Dictionary<IImportedScene>;
  let actors = {} as Dictionary<IImportedActor>;
  let labels = {} as Dictionary<IImportedLabel>;
  let movies = {} as Dictionary<IImportedMovie>;

  if (parsed.scenes) scenes = readScenes(parsed.scenes);
  if (parsed.actors) actors = readActors(parsed.actors);
  if (parsed.labels) labels = readLabels(parsed.labels);
  if (parsed.movies) movies = readMovies(parsed.movies);

  const data = {
    scenes,
    actors,
    labels,
    movies
  };

  console.log(data);
  await verifyFileData(data);
  await createFromFileData(data);
}

export async function checkImportFolders() {
  logger.log("Checking imports...");

  const config = await getConfig();
  const importedFile = await libraryPath("imported.txt");

  try {
    if (await existsAsync(importedFile))
      imported = (await readFileAsync(importedFile, "utf-8")).split("\n");
  } catch (error) {
    logger.error(error);
    return;
  }

  // Files to process
  const newFiles = [] as string[];

  logger.log(`Will ignore files: ${config.EXCLUDE_FILES}`);

  for (const folder of config.BULK_IMPORT_PATHS) {
    logger.log(`Checking import folder: ${folder}...`);
    await walk(folder, [".json", ".yaml"], async path => {
      if (basename(path).startsWith(".")) return;
      if (imported.includes(path)) return;
      newFiles.push(path);
      imported.push(path);
    });
  }

  // TODO: await writeFileAsync(importedFile, imported.join("\n"));

  logger.message(`Importing ${newFiles.length} import files...`);

  for (const file of newFiles) {
    logger.log(`Reading import file: ${file}...`);
    try {
      await processFile(file);
    } catch (err) {
      console.error(`${file}: could not read file.`);
      logger.error(err.message);
    }
  }
}
