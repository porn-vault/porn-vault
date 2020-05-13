<template>
  <ImportInfo :info="info">
    <template #title>
      Image import queue
    </template>
  </ImportInfo>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import ImportInfo, { QueueInformation } from "./ImportInfo.vue";

@Component({
  components: {
    ImportInfo,
  },
})
export default class ImageImportInfo extends Vue {
  info = null as null | QueueInformation;
  infoInterval = null as NodeJS.Timeout | null;

  created() {
    this.getInfo();
    this.infoInterval = setInterval(() => {
      this.getInfo();
    }, 5000);
  }

  destroyed() {
    if (this.infoInterval) clearInterval(this.infoInterval);
  }

  async getInfo() {
    const res = await ApolloClient.query({
      query: gql`
        {
          getImageImportInfo {
            currentFoundCount
            oldFoundCount
            importQueueLength
            running
            runningCount
            scanTypes
            isManualScanning
            isWatching
          }
        }
      `,
    });
    this.info = res.data.getImageImportInfo;
  }
}
</script>
