<template>
  <v-dialog
    :persistent="loader"
    scrollable
    :value="value"
    @input="$emit('input', $event)"
    max-width="400px"
  >
    <v-card :loading="loader">
      <v-card-title>
        <slot name="title" :selectedLabelIds="selectedLabelIds">{{ labelTitle }}</slot>
      </v-card-title>

      <v-text-field
        clearable
        color="primary"
        hide-details
        class="px-5 mb-2"
        label="Find labels..."
        v-model="innerSearchQuery"
        @input="$emit('changeSearchQuery', $event)"
      />

      <v-card-text style="max-height: 400px">
        <LabelSelector
          :searchQuery="innerSearchQuery"
          :items="allLabels"
          v-model="innerSelectedLabelIds"
          @input="$emit('changeSelectedLabelIds', $event)"
        />
      </v-card-text>
      <v-card-actions>
        <slot name="actions">
          <v-btn @click="innerSelectedLabelIds = []" text class="text-none"
            ><slot name="clear">Clear</slot></v-btn
          >
          <v-spacer></v-spacer>
          <v-btn :loading="loader" class="text-none" color="primary" text @click="$emit('confirm')">
            <slot name="confirm">{{ labelConfirm }}</slot>
          </v-btn></slot
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ILabel from "../types/label";
import LabelSelector from "./LabelSelector.vue";

@Component({
  components: {
    LabelSelector,
  },
})
export default class LabelSelectorDialog extends Vue {
  @Prop({ default: false }) value!: boolean; // Dialog open/closed
  @Prop({ default: "" }) labelTitle!: string;
  @Prop({ default: "Confirm" }) labelConfirm!: string;

  @Prop({ default: false }) loader!: boolean;
  @Prop({ default: () => [] }) selectedLabelIds!: string[];
  @Prop({ default: () => [] }) allLabels!: ILabel[];
  @Prop({ default: () => "" }) searchQuery!: string;

  innerSelectedLabelIds = Array.isArray(this.selectedLabelIds) ? [...this.selectedLabelIds] : [];
  innerSearchQuery = this.searchQuery || "";

  @Watch("selectedLabelIds")
  onSelectedLabelIdsChange(nextValue: string[]): void {
    this.innerSelectedLabelIds = [...nextValue];
  }

  @Watch("searchQuery")
  onSearchQueryChange(nextValue: string): void {
    this.innerSearchQuery = nextValue;
  }
}
</script>
