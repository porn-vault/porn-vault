import Scene from "../../types/scene";
import Image from "../../types/image";
import Actor from "../../types/actor";
import Label from "../../types/label";

export default {
  scenes(obj) {
    return Scene.getByActor(obj.id);
  },
  images(obj) {
    return Image.getByActor(obj.id);
  },
  labels(obj) {
    const actor = Actor.getById(obj.id);

    if (actor) {
      return actor.labels.map(id => Label.getById(id));
    }
    return [];
  }
}