<template>
  <div>
    <v-chip
      label
      class="mr-1 mb-1"
      small
      :outlined="!label.color"
      v-for="label in labels.slice(0, limit)"
      :key="label._id"
      :close="allowRemove"
      @click:close="removeLabel(label._id)"
      close-icon="mdi-close"
      :color="label.color || undefined"
      :light="textColor(label) === 'black'"
      :dark="textColor(label) === 'white'"
    >
      <span :style="{ color: textColor(label) }">
        {{ label.name }}
      </span>
    </v-chip>

    <div class="d-inline-block" v-if="labels.length > limit">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-chip v-on="on" label class="mr-1 mb-1" small outlined v-if="labels.length > 5"
            >...and more</v-chip
          >
        </template>
        {{
          labels
            .slice(limit, 999)
            .map((l) => l.name)
            .join(", ")
        }}
      </v-tooltip>
    </div>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import ILabel from "../types/label";
import { copy } from "../util/object";
import Color from "color";
import { detachLabelsFromItem } from "../api/label";

@Component
export default class LabelGroup extends Vue {
  @Prop({ default: () => [] }) value!: ILabel[];
  @Prop({ type: String, required: true }) item!: string;
  @Prop({ default: true }) allowRemove!: boolean;
  @Prop({ default: 5 }) limit!: number;

  textColor(label: ILabel) {
    return label.color ? (new Color(label.color).isDark() ? "white" : "black") : undefined;
  }

  get labels() {
    return this.value.sort((a, b) => a.name.localeCompare(b.name));
  }

  async removeLabel(id: string) {
    try {
      await detachLabelsFromItem(this.item, [id]);
      this.$emit(
        "input",
        copy(this.value).filter((x) => x._id !== id)
      );
    } catch (error) {}
  }
}
</script>

<style lang="scss" scoped></style>
