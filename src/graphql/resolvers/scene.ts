import Scene from "../../types/scene";
import Image from "../../types/image";
import Actor from "../../types/actor";
import Label from "../../types/label";

export default {
  actors(obj) {
    const scene = Scene.getById(obj.id);

    if (scene) {
      return scene.actors.map(id => Actor.getById(id));
    }
    return [];
  },
  images(obj) {
    return Image.getByScene(obj.id);
  },
  labels(obj) {
    const scene = Scene.getById(obj.id);

    if (scene) {
      return scene.labels.map(id => Label.getById(id));
    }
    return [];
  }
}