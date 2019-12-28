import CustomField, { CustomFieldType } from "../../types/custom_field";
import * as database from "../../database";

export default {
  async updateCustomField(
    _,
    {
      id,
      name,
      values
    }: { id: string; name?: string | null; values?: string[] | null }
  ) {
    const field = await CustomField.getById(id);

    if (field) {
      if (name) field.name = name;

      if (values) field.values = values;

      await database.update(
        database.store.customFields,
        { _id: field._id },
        field
      );

      return field;
    } else throw new Error("Custom field not found");
  },
  async removeCustomField(_, { id }: { id: string }) {
    await CustomField.remove(id);
    return true;
  },
  async createCustomField(
    _,
    {
      name,
      type,
      values
    }: { name: string; type: CustomFieldType; values?: string[] | null }
  ) {
    const field = new CustomField(name, type);

    if (
      type == CustomFieldType.SINGLE_SELECT ||
      type == CustomFieldType.MULTI_SELECT
    ) {
      if (values) field.values = values;
      else {
        throw new Error("Values have to be defined for select fields");
      }
    }

    await database.insert(database.store.customFields, field);
    return field;
  }
};
