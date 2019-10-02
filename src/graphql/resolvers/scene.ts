import Scene from "../../types/scene";
import Actor from "../../types/actor";
import Image from "../../types/image";

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
}