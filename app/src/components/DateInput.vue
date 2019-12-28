<template>
  <v-row>
    <v-col cols="3">
      <v-subheader>Date:</v-subheader>
    </v-col>
    <v-col cols="9">
      <v-text-field
        solo
        flat 
        :placeholder="placeholder"
        color="accent"
        clearable
        v-model="innerValue"
        label="Date"
        v-mask="'####-##-##'"
        :error-messages="errors"
        hide-details
      ></v-text-field>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import moment from "moment";

@Component({})
export default class DateInput extends Vue {
  @Prop({ default: null }) value!: number | null;
  @Prop({ default: "YYYY-MM-DD" }) placeholder!: string;

  innerValue = this.value ? moment(this.value).format("YYYY-MM-DD") : null;

  errors = [] as string[];

  get stamp() {
    if (this.innerValue) {
      return moment(this.innerValue, "YYYY-MM-DD")
        .toDate()
        .valueOf();
    }
    return null;
  }

  @Watch("innerValue")
  onInnerValueChange(newVal: string | null) {
    this.errors = [];
    if (newVal) {
      if (this.stamp !== null && isNaN(this.stamp)) {
        this.errors = ["Invalid date"];
      }

      this.$emit("input", this.stamp);
    } else this.$emit("input", null);
  }
}
</script>

<style scoped>

</style>
