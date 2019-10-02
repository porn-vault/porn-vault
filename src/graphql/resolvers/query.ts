import Actor from "../../types/actor";
import Label from "../../types/label";
import Scene from "../../types/scene";
import Image from "../../types/image";

interface HashMap<T> {
  [key: string]: T;
}

type AnyMap = HashMap<any>;

export default {
  getImages() {
    return Image.getAll();
  },

  getSceneById(parent, args: AnyMap) {
    return Scene.getById(args.id);
  },
  getScenes() {
    return Scene.getAll();
  },

  getActorById(parent, args: AnyMap) {
    return Actor.getById(args.id);
  },
  getActors() {
    return Actor.getAll();
  },
  findActors(parent, args: AnyMap) {
    return Actor.find(args.name);
  },

  getLabelById(parent, args: AnyMap) {
    return Label.getById(args.id);
  },
  getLabels() {
    return Label.getAll();
  },
  findLabel(parent, args: AnyMap) {
    return Label.find(args.name);
  }
}