<template>
  <v-card v-if="info" class="mb-3" style="border-radius: 10px">
    <v-card-title>
      <v-icon medium class="mr-2">mdi-progress-wrench</v-icon>
      <slot name="title">Import progress</slot>
    </v-card-title>

    <v-card-text>
      <div class="my-2">
        <span class="mr-2 d-inline-block headline">
          {{ info.currentFoundCount }}
        </span>
        <span class="subtitle-1">discovered </span>
        <span class="subtitle-1">of</span>
        &nbsp;
        <span class="mr-2 d-inline-block headline">
          {{ info.oldFoundCount }}
          <span class="subtitle-1">known</span>
        </span>
      </div>

      <div class="my-2">
        <span class="mr-2 d-inline-block headline">
          {{ info.runningCount }}
        </span>
        <span class="subtitle-1">importing</span>
        <span v-if="info.running" class="ml-3">
          <v-progress-circular
            size="20"
            width="2"
            indeterminate
          ></v-progress-circular>
        </span>
        &nbsp;
        <span class="mr-2 d-inline-block headline">
          {{ info.importQueueLength }}
        </span>
        <span class="subtitle-1">queued</span>
      </div>

      <div class="my-2">
        <span class="subtitle-1">Scan types:</span>
        <span class="subtitle-1">{{ info.scanTypes }}</span>
        <span class="mr-2 d-inline-block headline"> </span>
      </div>

      <div class="my-2">
        <span class="subtitle-1">Is manual scanning:</span>
        <span class="mr-2 d-inline-block headline">
          <i class="mdi mdi-sync" v-if="info.isManualScanning"></i>
          <i class="mdi mdi-sync-off" v-else></i>
        </span>
        <span class="subtitle-1">Is watching:</span>
        <span class="mr-2 d-inline-block headline">
          <i class="mdi mdi-sync" v-if="info.isWatching"></i>
          <i class="mdi mdi-sync-off" v-else></i>
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";

export interface QueueInformation {
  currentFoundCount: Number;
  oldFoundCount: Number;
  importQueueLength: Number;
  running: Boolean;
  runningCount: Number;
  scanTypes: String[];
  isManualScanning: Boolean;
  isWatching: Boolean;
}

const ImportInfoProps = Vue.extend({
  props: {
    info: {
      type: Object as () => QueueInformation,
    },
  },
});

@Component
export default class ImportInfo extends ImportInfoProps {}
</script>
