import IActor from "./actor";
import IScene from "./scene";

export interface IMarker {
  _id: string;
  name: string;
  time: number;
  labels: { _id: string; name: string }[];
  actors: IActor[];
  scene: IScene;
  favorite: boolean;
  bookmark: number | null;
  rating: number;
}
