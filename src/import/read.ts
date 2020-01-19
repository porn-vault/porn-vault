import { Dictionary } from "../types/utility";

// TODO: custom fields

export interface IImportedScene {
  name: string;
  path: string;
  releaseDate: number | null;
  actors: string[];
  labels: string[];
  customFields: Dictionary<string>;
  favorite: boolean;
  bookmark: boolean;
  rating: number | null;
}

export interface IImportedActor {
  name: string;
  bornOn: number | null;
  aliases: string[];
  labels: string[];
  customFields: Dictionary<string>;
  favorite: boolean;
  bookmark: boolean;
  rating: number | null;
}

export interface IImportedLabel {
  name: string;
  aliases: string[];
}

export interface IImportedMovie {
  name: string;
  releaseDate: number | null;
  scenes: string[];
  favorite: boolean;
  bookmark: boolean;
  rating: number | null;
  customFields: Dictionary<string>;
}

// TODO: studios

const isString = (i: any) => typeof i === "string";
const isValidDate = (d: any) => d instanceof Date && !isNaN(<any>d);

export function readMovies(
  importedScenes: Dictionary<any>
): Dictionary<IImportedMovie> {
  if (typeof importedScenes !== "object" || importedScenes === null)
    throw new Error(`Invalid movies section.`);

  let movies = {} as Dictionary<IImportedMovie>;

  for (const key in importedScenes) {
    const value = importedScenes[key];

    if (!value.name || !isString(value.name))
      throw new Error(`Invalid name for movie '${key}'.`);

    let movieName = value.name;
    let movieScenes = [] as string[];
    let movieReleaseDate = null as number | null;
    let movieRating = null as number | null;

    if (value.scenes) {
      if (!Array.isArray(value.scenes) || !value.scenes.every(isString))
        throw new Error(`Invalid scenes for movie '${key}'.`);

      movieScenes = value.scenes;
    }

    if (value.releaseDate) {
      const date = new Date(value.releaseDate);

      if (!isValidDate(date))
        throw new Error(`Invalid release date for movie '${key}'.`);

      movieReleaseDate = date.valueOf();
    }

    if (value.rating) {
      if (
        typeof value.rating !== "number" ||
        value.rating < 0 ||
        value.rating > 10
      )
        throw new Error(`Invalid rating for movie '${key}'.`);

      movieRating = value.rating;
    }

    movies[key] = {
      name: movieName,
      releaseDate: movieReleaseDate,
      customFields: {},
      scenes: movieScenes,
      favorite: !!value.favorite,
      bookmark: !!value.bookmark,
      rating: movieRating
    };
  }

  return movies;
}

export function readScenes(
  importedScenes: Dictionary<any>
): Dictionary<IImportedScene> {
  if (typeof importedScenes !== "object" || importedScenes === null)
    throw new Error(`Invalid scenes section.`);

  let scenes = {} as Dictionary<IImportedScene>;

  for (const key in importedScenes) {
    const value = importedScenes[key];

    if (!value.name || !isString(value.name))
      throw new Error(`Invalid name for scene '${key}'.`);

    if (!value.path || !isString(value.path))
      throw new Error(`Invalid path for scene '${key}'.`);

    let sceneName = value.name;
    let scenePath = value.path;
    let sceneActors = [] as string[];
    let sceneLabels = [] as string[];
    let sceneReleaseDate = null as number | null;
    let sceneRating = null as number | null;

    if (value.actors) {
      if (!Array.isArray(value.actors) || !value.actors.every(isString))
        throw new Error(`Invalid actors for scene '${key}'.`);

      sceneActors = value.actors;
    }

    if (value.labels) {
      if (!Array.isArray(value.labels) || !value.labels.every(isString))
        throw new Error(`Invalid labels for scene '${key}'.`);

      sceneLabels = value.labels;
    }

    if (value.releaseDate) {
      const date = new Date(value.releaseDate);

      if (!isValidDate(date))
        throw new Error(`Invalid release date for scene '${key}'.`);

      sceneReleaseDate = date.valueOf();
    }

    if (value.rating) {
      if (
        typeof value.rating !== "number" ||
        value.rating < 0 ||
        value.rating > 10
      )
        throw new Error(`Invalid rating for actor '${key}'.`);

      sceneRating = value.rating;
    }

    scenes[key] = {
      name: sceneName,
      path: scenePath,
      releaseDate: sceneReleaseDate,
      customFields: {},
      labels: sceneLabels,
      actors: sceneActors,
      favorite: !!value.favorite,
      bookmark: !!value.bookmark,
      rating: sceneRating
    };
  }

  return scenes;
}

export function readActors(
  importedActors: Dictionary<any>
): Dictionary<IImportedActor> {
  if (typeof importedActors !== "object" || importedActors === null)
    throw new Error(`Invalid actors section.`);

  let actors = {} as Dictionary<IImportedActor>;
  for (const key in importedActors) {
    const value = importedActors[key];

    if (!value.name || !isString(value.name))
      throw new Error(`Invalid name for actor '${key}'.`);

    let actorName = value.name;
    let actorAliases = [] as string[];
    let actorLabels = [] as string[];
    let actorBornOn = null as number | null;
    let actorRating = null as number | null;

    if (value.aliases) {
      if (!Array.isArray(value.aliases) || !value.aliases.every(isString))
        throw new Error(`Invalid aliases for actor '${key}'.`);

      actorAliases = value.aliases;
    }

    if (value.labels) {
      if (!Array.isArray(value.labels) || !value.labels.every(isString))
        throw new Error(`Invalid labels for actor '${key}'.`);

      actorLabels = value.labels;
    }

    if (value.bornOn) {
      const date = new Date(value.bornOn);

      if (!isValidDate(date))
        throw new Error(`Invalid birth date for actor '${key}'.`);

      actorBornOn = date.valueOf();
    }

    if (value.rating) {
      if (
        typeof value.rating !== "number" ||
        value.rating < 0 ||
        value.rating > 10
      )
        throw new Error(`Invalid rating for actor '${key}'.`);

      actorRating = value.rating;
    }

    actors[key] = {
      name: actorName,
      bornOn: actorBornOn,
      aliases: actorAliases,
      customFields: {},
      labels: actorLabels,
      favorite: !!value.favorite,
      bookmark: !!value.bookmark,
      rating: actorRating
    };
  }

  return actors;
}

export function readLabels(
  importedLabels: Dictionary<any>
): Dictionary<IImportedLabel> {
  if (typeof importedLabels !== "object" || importedLabels === null)
    throw new Error(`Invalid labels section.`);

  let labels = {} as Dictionary<IImportedLabel>;

  for (const key in importedLabels) {
    const value = importedLabels[key];

    if (!value.name || !isString(value.name))
      throw new Error(`Invalid name for actor '${key}'.`);

    let labelName = value.name;
    let labelAliases = [] as string[];

    if (value.aliases) {
      if (!Array.isArray(value.aliases) || !value.aliases.every(isString))
        throw new Error(`Invalid aliases for label '${key}'.`);

      labelAliases = value.aliases;
    }

    labels[key] = {
      name: labelName,
      aliases: labelAliases
    };
  }
  return labels;
}
