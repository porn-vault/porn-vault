import { database } from "../database";
import Actor from "../types/actor";
import Label from "../types/label";
import { GraphQLUpload } from 'graphql-upload'
import GraphQLLong from 'graphql-type-long';
import { ReadStream, createWriteStream, statSync } from "fs";
import { extname } from "path";
import Scene from "../types/scene";
import ffmpeg from "fluent-ffmpeg";

interface HashMap<T> {
  [key: string]: T;
}

type AnyMap = HashMap<any>;

export default {
  Upload: GraphQLUpload,
  Long: GraphQLLong,

  getScenes() {
    return Scene.getAll();
  },

  async uploadScene(args: AnyMap) {
    const { filename, mimetype, createReadStream } = await args.file;
    const ext = extname(filename);

    // !TODO check mimetype

    const scene = new Scene(filename.split(".")[0]);
    const path = `./library/scenes/${scene.id}${ext}`;
    scene.path = path;

    const read = createReadStream() as ReadStream;
    const write = createWriteStream(path);

    const pipe = read.pipe(write);

    await new Promise((resolve, reject) => {
      pipe.on("close", () => resolve());
    });

    // File written, now process
    // console.log(`SUCCESS: File written to ${path}`);

    await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(path, (err, data) => {
        const meta = data.streams[0];
        const { size } = statSync(path);

        if (meta) {
          scene.meta.dimensions = {
            width: meta.width,
            height: meta.height,
          }
          scene.meta.duration = parseInt(meta.duration);
        }
        else {
          console.warn("WARN: Could not get video meta data.");
        }

        scene.meta.size = size;
        resolve();
      })
    })

    await scene.generateThumbnails();

    database
      .get('scenes')
      .push(scene)
      .write();

    // Done

    return filename;
  },

  getActorById(args: AnyMap) {
    return Actor.getById(args.id);
  },
  getActors() {
    return Actor.getAll();
  },
  findActors(args: AnyMap) {
    return Actor.find(args.name);
  },
  addActor(args: AnyMap) {
    const actor = new Actor(args.name, args.aliases)

    database
      .get('actors')
      .push(actor)
      .write();

    return actor;
  },

  getLabelById(args: AnyMap) {
    return Label.getById(args.id);
  },
  getLabels() {
    return Label.getAll();
  },
  addLabel(args: AnyMap) {
    const label = new Label(args.name, args.aliases);

    database
      .get("labels")
      .push(label)
      .write();

    return label;
  },
  findLabel(args: AnyMap) {
    return Label.find(args.name);
  }
};