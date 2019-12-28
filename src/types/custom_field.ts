import { generateHash } from "../hash";

export enum CustomFieldType {
  INTEGER = "INTEGER",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT"
}

export default class CustomField {
  _id: string;
  name: string;
  values: string[] | null = [];
  type: CustomFieldType;
  unit = null;

  constructor(name: string, type: CustomFieldType) {
    this._id = "cf_" + generateHash();
    this.name = name;
    this.type = type;
  }
}
