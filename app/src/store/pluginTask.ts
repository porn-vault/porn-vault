import { Module, Mutation, VuexModule } from "vuex-class-modules";

import store from ".";

@Module
class PluginTask extends VuexModule {
  loader = false;
  itemsName = "";
  iteratedCount = -1;
  totalCount = -1;

  get message() {
    if (this.totalCount <= 0 || this.iteratedCount < 0) {
      return "Initializing...";
    }

    return `Running plugins on ${this.itemsName} ${Math.min(
      this.iteratedCount + 1,
      this.totalCount
    )} of ${this.totalCount}. Do not close this tab.`;
  }

  @Mutation
  startLoading(payload: { itemsName: string; total?: number }) {
    this.loader = true;
    this.itemsName = payload.itemsName;
    this.iteratedCount = 0;
    this.totalCount = payload.total ?? -1;
  }

  @Mutation
  incrementProgress() {
    this.iteratedCount++;
  }


  @Mutation
  stopLoading() {
    this.loader = false;
    this.iteratedCount = -1;
    this.totalCount = -1;
  }

  @Mutation
  setProgress(payload: { iteratedCount: number; total: number }) {
    this.iteratedCount = payload.iteratedCount;
    this.totalCount = payload.total;
  }
}

export const pluginTaskModule = new PluginTask({ store, name: "pluginTask" });
