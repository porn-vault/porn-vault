<template>
  <div class="mb-1 px-3 d-flex align-center">
    <div @click="$emit('jump')" class="hover d-flex align-center" style="min-width: 0">
      <div class="mr-2 med--text">
        {{ formatTime(value.time) }}
      </div>
      <v-icon class="mr-1" small color="red" v-if="value.favorite">mdi-heart</v-icon>
      <v-icon class="mr-1" small color="primary" v-if="value.bookmark !== null">mdi-bookmark</v-icon>
      <v-tooltip bottom v-if="value.labels && value.labels.length">
        <template v-slot:activator="{ on }">
          <div
            @click="$emit('jump')"
            v-on="on"
            class="font-weight-bold hover text-truncate"
            style="overflow: hidden"
          >
            {{ value.name }}
          </div>
        </template>
        {{ value.labels.map((l) => l.name).join(", ") }}
      </v-tooltip>
      <div
        @click="$emit('jump')"
        v-else
        class="font-weight-bold hover text-truncate"
        style="overflow: hidden"
      >
        {{ value.name }}
      </div>
    </div>

    <v-spacer></v-spacer>
    <v-btn @click="startEdit" class="ml-1" color="grey" small icon>
      <v-icon small>mdi-pencil</v-icon>
    </v-btn>
    <v-btn
      small
      text
      :color="errorState === 0 ? 'warning' : 'error'"
      @click="errorClick"
      class="px-0 text-none"
    >
      {{ errorState === 0 ? "Delete" : "Confirm" }}
    </v-btn>

    <v-dialog v-model="updateDialog" max-width="400px">
      <v-card>
        <v-card-title>Update '{{ value.name }}'</v-card-title>
        <v-card-text>
          <v-combobox
            clearable
            :items="labels.map((l) => l.name)"
            placeholder="Marker title"
            color="primary"
            v-model="updateName"
          ></v-combobox>

          <v-btn
            @click="markerLabelSelectorDialog = true"
            text
            color="primary"
            class="text-none mb-2"
            >{{
              updateLabels.length
                ? `Selected ${updateLabels.length} ${updateLabels.length == 1 ? "label" : "labels"}`
                : "Select labels"
            }}</v-btn
          >

          <ActorSelector v-model="updateActors" />

          <Rating @input="updateRating = $event" class="px-2" :value="updateRating" />

          <v-checkbox
            hide-details
            color="primary"
            v-model="updateFavorite"
            label="Favorite?"
          ></v-checkbox>

          <v-checkbox
            hide-details
            color="primary"
            v-model="updateBookmark"
            label="Bookmark?"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            @click="updateMarker"
            :disabled="!updateName"
            color="primary"
            text
            class="text-none"
            >Edit</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <LabelSelectorDialog
      v-model="markerLabelSelectorDialog"
      labelTitle="Select marker labels"
      labelConfirm="OK"
      :loader="false"
      :selectedLabelIds="updateLabels"
      :allLabels="labels"
      @changeSelectedLabelIds="updateLabels = $event"
      @confirm="markerLabelSelectorDialog = false"
    >
    </LabelSelectorDialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import moment from "moment";
import ILabel from "@/types/label";
import ActorSelector from "@/components/ActorSelector.vue";
import LabelSelectorDialog from "@/components/LabelSelectorDialog.vue";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";
import { copy } from "@/util/object";
import IActor from "@/types/actor";
import { IMarker } from "@/types/marker";

@Component({
  components: {
    LabelSelectorDialog,
    ActorSelector,
  },
})
export default class MarkerItem extends Vue {
  @Prop(Object) value!: IMarker;
  @Prop({ default: () => [] }) labels!: ILabel[];
  @Prop({ default: () => [] }) actors!: IActor[];

  updateDialog = false;
  updateName = this.value.name;
  updateFavorite = this.value.favorite;
  updateBookmark = this.value.bookmark;
  updateRating = this.value.rating;
  updateActors: IActor[] = [];

  markerLabelSelectorDialog = false;
  updateLabels: string[] = [];

  updateMarker() {
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!, $opts: MarkerUpdateOpts!) {
          updateMarkers(ids: $ids, opts: $opts) {
            name
            time
            favorite
            bookmark
            rating
            labels {
              _id
              name
              aliases
            }
          }
        }
      `,
      variables: {
        ids: [this.value._id],
        opts: {
          name: this.updateName,
          favorite: this.updateFavorite,
          rating: this.updateRating,
          bookmark: this.updateBookmark ? Date.now() : null,
          labels: this.updateLabels.map((i) => this.labels[i]).map((l) => l._id),
          actors: this.updateActors.map((l) => l._id),
        },
      },
    })
      .then((res) => {
        const marker = copy(this.value);
        Object.assign(marker, res.data.updateMarkers[0]);
        this.$emit("input", marker);
        this.updateDialog = false;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  startEdit() {
    this.updateLabels = this.value.labels.map((l) => l._id);
    this.updateActors = copy(this.value.actors);
    this.updateDialog = true;
  }

  errorState = 0;

  errorClick() {
    if (this.errorState == 0) {
      this.errorState = 1;
      setTimeout(() => {
        this.errorState = 0;
      }, 2500);
    } else {
      this.$emit("delete");
    }
  }

  formatTime(secs: number) {
    return moment().startOf("day").seconds(secs).format("H:mm:ss");
  }
}
</script>
