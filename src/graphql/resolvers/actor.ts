import Scene from "../../types/scene";
import Image from "../../types/image";
import Actor from "../../types/actor";

export default {
  scenes(obj) {
    return Scene.getByActor(obj.id);
  },
  images(obj) {
    return Image.getByActor(obj.id);
  },
}