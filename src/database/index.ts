import { existsSync } from "fs";
import ora from "ora";

import args from "../args";
import { ISceneProcessingItem } from "../queue/processing";
import Actor from "../types/actor";
import ActorReference from "../types/actor_reference";
import CustomField from "../types/custom_field";
import Image from "../types/image";
import Label from "../types/label";
import LabelledItem from "../types/labelled_item";
import Marker from "../types/marker";
import Movie from "../types/movie";
import MovieScene from "../types/movie_scene";
import Scene from "../types/scene";
import Studio from "../types/studio";
import SceneView from "../types/watch";
import { mkdirpSync } from "../utils/fs/async";
import { logger } from "../utils/logger";
import { libraryPath } from "../utils/path";
import { Izzy } from "./internal";

mkdirpSync("tmp/");

export function formatCollectionName(name: string) {
  if (!process.env.NODE_ENV || process.env.NODE_ENV === "production") {
    return `${name}`;
  }
  return `${process.env.NODE_ENV}-${name}`;
}

export const collections = {
  scenes: null as unknown as Izzy.Collection<Scene>,
  images: null as unknown as Izzy.Collection<Image>,
  actors: null as unknown as Izzy.Collection<Actor>,
  movies: null as unknown as Izzy.Collection<Movie>,
  labelledItems: null as unknown as Izzy.Collection<LabelledItem>,
  movieScenes: null as unknown as Izzy.Collection<MovieScene>,
  actorReferences: null as unknown as Izzy.Collection<ActorReference>,
  views: null as unknown as Izzy.Collection<SceneView>,
  labels: null as unknown as Izzy.Collection<Label>,
  customFields: null as unknown as Izzy.Collection<CustomField>,
  markers: null as unknown as Izzy.Collection<Marker>,
  studios: null as unknown as Izzy.Collection<Studio>,
  processing: null as unknown as Izzy.Collection<ISceneProcessingItem>,
};

interface CollectionItem<T extends { _id: string }> {
  key: keyof typeof collections;
  name: string;
  path: string;
  indexes: Izzy.IIndexCreation<T>[];
}

export const collectionDefinitions = {
  customFields: {
    key: "customFields",
    name: "custom_fields",
    path: "custom_fields.db",
    indexes: [],
  } as CollectionItem<CustomField>,
  labels: {
    key: "labels",
    name: "labels",
    path: "labels.db",
    indexes: [],
  } as CollectionItem<Label>,
  views: {
    key: "views",
    name: "scene_views",
    path: "scene_views.db",
    indexes: [
      {
        key: "scene",
        name: "scene-index",
      },
    ],
  } as CollectionItem<SceneView>,
  actorReferences: {
    key: "actorReferences",
    name: "actor-references",
    path: "actor_references.db",
    indexes: [
      {
        name: "actor-index",
        key: "actor",
      },
      {
        name: "item-index",
        key: "item",
      },
      {
        name: "type-index",
        key: "type",
      },
    ],
  } as CollectionItem<ActorReference>,
  movieScenes: {
    key: "movieScenes",
    name: "movie-scenes",
    path: "movie_scenes.db",
    indexes: [
      {
        name: "movie-index",
        key: "movie",
      },
      {
        name: "scene-index",
        key: "scene",
      },
    ],
  } as CollectionItem<MovieScene>,
  labelledItems: {
    key: "labelledItems",
    name: "labelled-items",
    path: "labelled_items.db",
    indexes: [
      {
        name: "label-index",
        key: "label",
      },
      {
        name: "item-index",
        key: "item",
      },
      {
        name: "type-index",
        key: "type",
      },
    ],
  } as CollectionItem<LabelledItem>,
  images: {
    key: "images",
    name: "images",
    path: "images.db",
    indexes: [
      {
        name: "path-index",
        key: "path",
      },
    ],
  } as CollectionItem<Image>,
  scenes: {
    key: "scenes",
    name: "scenes",
    path: "scenes.db",
    indexes: [
      {
        name: "studio-index",
        key: "studio",
      },
      {
        name: "path-index",
        key: "path",
      },
    ],
  } as CollectionItem<Scene>,
  actors: {
    key: "actors",
    name: "actors",
    path: "actors.db",
    indexes: [],
  } as CollectionItem<Actor>,
  movies: {
    key: "movies",
    name: "movies",
    path: "movies.db",
    indexes: [
      {
        name: "studio-index",
        key: "studio",
      },
    ],
  } as CollectionItem<Movie>,
  markers: {
    key: "markers",
    name: "markers",
    path: "markers.db",
    indexes: [
      {
        name: "scene-index",
        key: "scene",
      },
    ],
  } as CollectionItem<Marker>,
  studios: {
    key: "studios",
    name: "studios",
    path: "studios.db",
    indexes: [
      {
        key: "parent",
        name: "parent-index",
      },
    ],
  } as CollectionItem<Studio>,
  processing: {
    key: "processing",
    name: "processing",
    path: "processing.db",
    indexes: [],
  } as CollectionItem<ISceneProcessingItem>,
};

export enum CollectionBuildStatus {
  None = "none",
  Loading = "loading",
  Ready = "ready",
}

export interface CollectionBuildInfo {
  name: string;
  status: CollectionBuildStatus;
}

export const collectionBuildInfoMap: { [collectionName: string]: CollectionBuildInfo } = {};
resetBuildInfo();

function resetBuildInfo(): void {
  const info = Object.values(collectionDefinitions).reduce<{
    [collectionName: string]: CollectionBuildInfo;
  }>((acc, collectionDefinition) => {
    acc[collectionDefinition.key] = {
      name: formatCollectionName(collectionDefinition.name),
      status: CollectionBuildStatus.None,
    };
    return acc;
  }, {});
  Object.assign(collectionBuildInfoMap, info);
}

export async function loadStore<T extends { _id: string }>(
  collectionItem: CollectionItem<T>
): Promise<void> {
  collectionBuildInfoMap[collectionItem.key].status = CollectionBuildStatus.Loading;
  collections[collectionItem.key] = await Izzy.createCollection<any>(
    formatCollectionName(collectionItem.name),
    libraryPath(collectionItem.path),
    collectionItem.indexes
  );
  collectionBuildInfoMap[collectionItem.key].status = CollectionBuildStatus.Ready;
}

export async function loadStores(): Promise<void> {
  const crossReferencePath = libraryPath("cross_references.db");
  if (existsSync(crossReferencePath)) {
    throw new Error("cross_references.db found, are you using an outdated library?");
  }

  logger.debug("Creating folders if needed");
  mkdirpSync(libraryPath("images/"));
  mkdirpSync(libraryPath("thumbnails/")); // generated screenshots
  mkdirpSync(libraryPath("thumbnails/images")); // generated image thumbnails
  mkdirpSync(libraryPath("thumbnails/markers")); // generated marker thumbnails
  mkdirpSync(libraryPath("previews/"));

  const dbLoader = ora("Loading DB").start();

  resetBuildInfo();
  for (const collectionItem of Object.values(collectionDefinitions)) {
    await loadStore(collectionItem as CollectionItem<any>);
  }

  logger.debug("Created Izzy collections");

  if (!args["skip-compaction"]) {
    const compactLoader = ora("Compacting DB...").start();
    for (const collection of Object.values(collections)) {
      await collection.compact();
    }
    compactLoader.succeed("Compacted DB");
  } else {
    logger.debug("Skipping compaction");
  }

  dbLoader.succeed();
}
