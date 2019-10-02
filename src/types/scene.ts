import { database } from "../database";
import { generateHash } from "../hash";

export class VideoDimensions {
  width: number | null = null;
  height: number | null = null;
}

export class SceneMeta {
  size: number | null = null;
  duration: number | null = null;
  dimensions = new VideoDimensions();
}

export default class Scene {
  id: string;
  name: string;
  addedOn = +new Date();
  releaseDate: string | null = null;
  thumbnails: string[] = [];
  coverIndex: number = 0;
  favorite: boolean = false;
  bookmark: boolean = false;
  rating: number = 0;
  customFields: any = {};
  labels: string[] = [];
  movies: string[] = [];
  path: string | null = null;
  streamLinks: string[] = [];
  watches: number[] = []; // Array of timestamps of watches
  meta = new SceneMeta();

  static find(name: string): Scene[] {
    name = name.toLowerCase().trim();
    return Scene
      .getAll()
      .filter(scene => scene.name.toLowerCase() == name)
  }

  static getById(id: string): Scene | null {
    return database
      .get('scenes')
      .findKey(id)
      .value();
  }

  static getAll(): Scene[] {
    return database.get('scenes').value();
  }

  constructor(name: string) {
    this.id = generateHash();
    this.name = name.trim();
  }

  async generateThumbnails() {
    // !TODO:
  }
}