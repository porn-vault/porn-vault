import { hash } from '@/util/generator';
import Video from "./video";
import store from "../store";
import { CustomFieldValue } from './common';

export default class Actor {
  id: string = hash();
  name: string = "";
  aliases: string[] = [];
  addedOn: number = +new Date();
  thumbnails: string[] = [];
  favorite: boolean = false;
  bookmark: boolean = false;
  rating: number = 0;
  customFields: CustomFieldValue = {};
  coverIndex: number = 0;
  labels: string[] = [];

  static create(name: string): Actor {
    let actor = new Actor();
    actor.name = name;
    return actor;
  }
}