import Scene from "../../types/scene";

export default {
  scene(obj) {
    return Scene.getById(obj.scene);
  }
}