import Scene from "../../types/scene";
import Image from "../../types/image";
import Actor from "../../types/actor";
import Label from "../../types/label";

export default {
  scene(obj) {
    return Scene.getById(obj.scene);
  },
  labels(obj) {
    const image = Image.getById(obj.id);

    if (image) {
      return image.labels.map(id => Label.getById(id));
    }
    return [];
  }
}