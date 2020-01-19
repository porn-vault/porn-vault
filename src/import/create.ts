import { Dictionary } from "../types/utility";
import {
  IImportedScene,
  IImportedActor,
  IImportedLabel,
  IImportedMovie
} from "./read";

export interface ICreateOptions {
  scenes: Dictionary<IImportedScene>;
  actors: Dictionary<IImportedActor>;
  labels: Dictionary<IImportedLabel>;
  movies: Dictionary<IImportedMovie>;
}

export async function createFromFileData(opts: ICreateOptions) {}
