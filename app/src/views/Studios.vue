<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Studios" />

    <v-navigation-drawer v-if="showSidenav" style="z-index: 14" v-model="drawer" clipped app>
      <v-container>
        <v-btn
          :disabled="searchStateManager.refreshed"
          class="text-none mb-2"
          block
          color="primary"
          text
          @click="resetPagination"
          >Refresh</v-btn
        >

        <v-text-field
          @keydown.enter="resetPagination"
          solo
          flat
          single-line
          hide-details
          clearable
          color="primary"
          :value="searchState.query"
          @input="searchStateManager.onValueChanged('query', $event)"
          label="Search query"
          class="mb-2"
        ></v-text-field>

        <div class="d-flex align-center">
          <v-btn
            :color="searchState.favoritesOnly ? 'red' : undefined"
            icon
            @click="searchStateManager.onValueChanged('favoritesOnly', !searchState.favoritesOnly)"
          >
            <v-icon>{{ searchState.favoritesOnly ? "mdi-heart" : "mdi-heart-outline" }}</v-icon>
          </v-btn>

          <v-btn
            :color="searchState.bookmarksOnly ? 'primary' : undefined"
            icon
            @click="searchStateManager.onValueChanged('bookmarksOnly', !searchState.bookmarksOnly)"
          >
            <v-icon>{{
              searchState.bookmarksOnly ? "mdi-bookmark" : "mdi-bookmark-outline"
            }}</v-icon>
          </v-btn>

          <v-spacer></v-spacer>
        </div>

        <Divider icon="mdi-label">Labels</Divider>

        <LabelFilter
          @input="searchStateManager.onValueChanged('selectedLabels', $event)"
          class="mt-0"
          :value="searchState.selectedLabels"
          :items="allLabels"
        />

        <Divider icon="mdi-sort">Sort</Divider>

        <v-select
          solo
          flat
          single-line
          hide-details
          color="primary"
          item-text="text"
          item-value="value"
          :value="searchState.sortBy"
          @change="searchStateManager.onValueChanged('sortBy', $event)"
          placeholder="Sort by..."
          :items="sortByItems"
          class="mt-0 pt-0 mb-2"
        ></v-select>
        <v-select
          solo
          flat
          single-line
          :disabled="searchState.sortBy == 'relevance' || searchState.sortBy == '$shuffle'"
          hide-details
          color="primary"
          item-text="text"
          item-value="value"
          :value="searchState.sortDir"
          @change="searchStateManager.onValueChanged('sortDir', $event)"
          placeholder="Sort direction"
          :items="sortDirItems"
        ></v-select>
      </v-container>
    </v-navigation-drawer>

    <v-expand-transition>
      <v-banner app sticky class="mb-2" v-if="selectionMode">
        <div class="d-flex align-center">
          <v-tooltip bottom v-if="!selectedStudios.length">
            <template #activator="{ on }">
              <v-btn icon v-on="on" @click="selectedStudios = studios.map((im) => im._id)">
                <v-icon>mdi-checkbox-blank-circle-outline</v-icon>
              </v-btn>
            </template>
            Select all
          </v-tooltip>
          <v-tooltip bottom v-else>
            <template #activator="{ on }">
              <v-btn icon v-on="on" @click="selectedStudios = []">
                <v-icon>mdi-checkbox-marked-circle</v-icon>
              </v-btn>
            </template>
            Deselect
          </v-tooltip>

          <div class="title ml-2">
            {{ selectedStudios.length }}
          </div>
        </div>

        <template v-slot:actions>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                :disabled="!selectedStudios.length"
                v-on="on"
                @click="runPluginsForSelectedStudios"
                :loading="pluginLoader"
                icon
              >
                <v-icon>mdi-database-sync</v-icon>
              </v-btn>
            </template>
            Run plugins for selected studios
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                v-on="on"
                @click="addLabelsDialog = true"
                icon
                :disabled="!selectedStudios.length"
              >
                <v-icon>mdi-label</v-icon>
              </v-btn>
            </template>
            Add labels
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                v-on="on"
                @click="subtractLabelsDialog = true"
                icon
                :disabled="!selectedStudios.length"
              >
                <v-icon>mdi-label-off</v-icon>
              </v-btn>
            </template>
            Subtract labels
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                :disabled="!selectedStudios.length"
                v-on="on"
                @click="deleteSelectedStudiosDialog = true"
                icon
                color="error"
                ><v-icon>mdi-delete-forever</v-icon>
              </v-btn>
            </template>
            Delete
          </v-tooltip>
        </template>
      </v-banner>
    </v-expand-transition>

    <div class="text-center" v-if="fetchError">
      <div>There was an error</div>
      <v-btn class="mt-2" @click="loadPage">Try again</v-btn>
    </div>
    <div v-else>
      <div class="mb-2 d-flex align-center">
        <div class="mr-3">
          <span class="display-1 font-weight-bold mr-2">{{ fetchLoader ? "-" : numResults }}</span>
          <span class="title font-weight-regular">studios found</span>
        </div>

        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="bulkImportDialog = true" icon>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <span>Add studio</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" :loading="fetchingRandom" @click="getRandom" icon>
              <v-icon>mdi-shuffle-variant</v-icon>
            </v-btn>
          </template>
          <span>Get random studio</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" :disabled="searchState.sortBy != '$shuffle'" @click="rerollSeed" icon>
              <v-icon>mdi-dice-3-outline</v-icon>
            </v-btn>
          </template>
          <span>Reshuffle</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="runPluginsForSearch" icon :loading="pluginLoader">
              <v-icon>mdi-database-sync</v-icon>
            </v-btn>
          </template>
          <span>Run plugins for all studios in current search</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="toggleSelectionMode" icon>
              <v-icon
                >{{
                  selectionMode ? "mdi-checkbox-blank-off-outline" : "mdi-checkbox-blank-outline"
                }}
              </v-icon>
            </v-btn>
          </template>
          <span>Toggle selection mode</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <div>
          <v-pagination
            v-if="!fetchLoader && $vuetify.breakpoint.mdAndUp"
            :value="searchState.page"
            @input="onPageChange"
            :total-visible="9"
            :disabled="fetchLoader"
            :length="numPages"
          ></v-pagination>
        </div>
      </div>
      <v-row v-if="!fetchLoader && numResults">
        <v-col
          class="pa-1"
          v-for="(studio, studioIdx) in studios"
          :key="studio._id"
          cols="6"
          sm="6"
          md="4"
          lg="3"
          xl="2"
        >
          <studio-card
            :class="
              selectedStudios.length && !selectedStudios.includes(studio._id) ? 'not-selected' : ''
            "
            :showLabels="showCardLabels"
            :studio="studio"
            style="height: 100%"
            @click.native.stop.prevent="onStudioClick(studio, studioIdx, $event, false)"
          >
            <template v-slot:action="{ hover }">
              <v-fade-transition>
                <v-checkbox
                  v-if="selectionMode || hover || selectedStudios.includes(studio._id)"
                  color="primary"
                  :input-value="selectedStudios.includes(studio._id)"
                  readonly
                  @click.native.stop.prevent="onStudioClick(studio, studioIdx, $event, true)"
                  class="mt-0"
                  hide-details
                  :contain="true"
                ></v-checkbox>
              </v-fade-transition>
            </template>
          </studio-card>
        </v-col>
      </v-row>
      <NoResults v-else-if="!fetchLoader && !numResults" />
      <Loading v-else />
    </div>
    <div class="mt-3" v-if="numResults && numPages > 1">
      <v-pagination
        :value="searchState.page"
        @input="onPageChange"
        :total-visible="9"
        :disabled="fetchLoader"
        :length="numPages"
      ></v-pagination>
      <div class="text-center mt-3">
        <v-text-field
          @keydown.enter="onPageChange(jumpPage)"
          :disabled="fetchLoader"
          solo
          flat
          color="primary"
          v-model.number="jumpPage"
          placeholder="Page #"
          class="d-inline-block mr-2"
          style="width: 60px"
          hide-details
        >
        </v-text-field>
        <v-btn
          :disabled="fetchLoader"
          color="primary"
          class="text-none"
          text
          @click="onPageChange(jumpPage)"
          >Load</v-btn
        >
      </div>
    </div>

    <v-dialog :persistent="bulkLoader" scrollable v-model="bulkImportDialog" max-width="400px">
      <v-card :loading="bulkLoader">
        <v-card-title>Create studio(s)</v-card-title>

        <v-card-text style="max-height: 400px">
          <v-textarea
            color="primary"
            v-model="studiosBulkText"
            auto-grow
            :rows="3"
            placeholder="Studio names"
            persistent-hint
            hint="1 studio name per line"
          ></v-textarea>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            @click="runBulkImport"
            text
            color="primary"
            class="text-none"
            :disabled="!studiosBulkImport.length"
            >Add {{ studiosBulkImport.length }} studios</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteSelectedStudiosDialog" max-width="400px">
      <v-card>
        <v-card-title>Really delete {{ selectedStudios.length }} studios?</v-card-title>
        <v-card-text> Scenes, images and movies will stay in your collection </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="text-none"
            color="error"
            text
            @click="deleteSelection"
            :loading="deleteStudiosLoader"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <LabelSelectorDialog
      v-model="addLabelsDialog"
      labelConfirm="Commit"
      :loader="addLoader"
      :selectedLabelIds="addLabelIds"
      :allLabels="allLabels"
      @changeSelectedLabelIds="addLabelIds = $event"
      @confirm="addLabels"
    >
      <template #title>
        Add {{ addLabelIds.length }} {{ addLabelIds.length === 1 ? "label" : "labels" }}
      </template>
    </LabelSelectorDialog>

    <LabelSelectorDialog
      v-model="subtractLabelsDialog"
      labelConfirm="Commit"
      :loader="subtractLoader"
      :selectedLabelIds="subtractLabelIds"
      :allLabels="allLabels"
      @changeSelectedLabelIds="subtractLabelIds = $event"
      @confirm="subtractLabels"
    >
      <template #title>
        Subtract {{ subtractLabelIds.length }}
        {{ subtractLabelIds.length === 1 ? "label" : "labels" }}
      </template>
    </LabelSelectorDialog>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";
import { contextModule } from "@/store/context";
import ILabel from "@/types/label";
import studioFragment from "@/fragments/studio";
import StudioCard from "@/components/Cards/Studio.vue";
import { mixins } from "vue-class-component";
import DrawerMixin from "@/mixins/drawer";
import { isQueryDifferent, SearchStateManager } from "../util/searchState";
import { Dictionary, Route } from "vue-router/types/router";
import { Studio } from "@/api/studio";
import IStudio from "@/types/studio";
import { pluginTaskModule } from "@/store/pluginTask";
import LabelSelectorDialog from "@/components/LabelSelectorDialog.vue";
import { attachLabelsToItem, detachLabelsFromItem } from "@/api/label";

@Component({
  components: {
    StudioCard,
    LabelSelectorDialog,
  },
})
export default class StudioList extends mixins(DrawerMixin) {
  get showSidenav() {
    return contextModule.showSidenav;
  }

  rerollSeed() {
    const seed = Math.random().toString(36);
    localStorage.setItem("pm_seed", seed);
    if (this.searchState.sortBy === "$shuffle") this.loadPage();
    return seed;
  }

  studios = [] as any[];

  fetchLoader = false;
  fetchError = false;
  fetchingRandom = false;
  numResults = 0;
  numPages = 0;
  selectionMode = false;

  deleteStudiosLoader = false;
  selectedStudios = [] as string[];
  lastSelectionStudioId: string | null = null;
  deleteSelectedStudiosDialog = false;

  searchStateManager = new SearchStateManager<{
    page: number;
    query: string;
    favoritesOnly: boolean;
    bookmarksOnly: boolean;
    selectedLabels: { include: string[]; exclude: string[] };
    sortBy: string;
    sortDir: string;
  }>({
    localStorageNamer: (key: string) => `pm_studio${key[0].toUpperCase()}${key.substr(1)}`,
    props: {
      page: {
        default: () => 1,
      },
      query: true,
      favoritesOnly: { default: () => false },
      bookmarksOnly: { default: () => false },
      selectedLabels: { default: () => ({ include: [], exclude: [] }) },
      sortBy: { default: () => "relevance" },
      sortDir: {
        default: () => "desc",
      },
    },
  });

  jumpPage: string | null = null;

  get searchState() {
    return this.searchStateManager.state;
  }

  studiosBulkText = "" as string | null;
  bulkImportDialog = false;
  bulkLoader = false;

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  async runBulkImport() {
    this.bulkLoader = true;

    try {
      for (const name of this.studiosBulkImport) {
        await this.createStudioWithName(name);
      }
      this.loadPage();
      this.bulkImportDialog = false;
    } catch (error) {
      console.error(error);
    }

    this.studiosBulkText = "";
    this.bulkLoader = false;
  }

  get studiosBulkImport() {
    if (this.studiosBulkText) return this.studiosBulkText.split("\n").filter(Boolean);
    return [];
  }

  tryReadLabelsFromLocalStorage(key: string) {
    return (localStorage.getItem(key) || "").split(",").filter(Boolean) as string[];
  }

  allLabels = [] as ILabel[];

  @Watch("$route")
  onRouteChange(to: Route, from: Route) {
    if (isQueryDifferent(to.query as Dictionary<string>, from.query as Dictionary<string>)) {
      // Only update the state and reload, if the query changed => filters changed
      this.searchStateManager.parseFromQuery(to.query as Dictionary<string>);
      this.loadPage();
      return;
    }
  }

  onPageChange(val: number) {
    let page = Number(val);
    if (isNaN(page) || page <= 0 || page > this.numPages) {
      page = 1;
    }
    this.jumpPage = null;
    this.searchStateManager.onValueChanged("page", page);
    this.updateRoute(this.searchStateManager.toQuery(), false, () => {
      // If the query wasn't different, just reset the flag
      this.searchStateManager.refreshed = true;
    });
  }

  updateRoute(query: { [x: string]: string }, replace = false, noChangeCb: Function | null = null) {
    if (isQueryDifferent(query, this.$route.query as Dictionary<string>)) {
      // Only change the current url if the new url will be different to avoid redundant navigation
      const update = {
        name: "studios",
        query, // Always override the current query
      };
      if (replace) {
        this.$router.replace(update);
      } else {
        this.$router.push(update);
      }
    } else {
      noChangeCb?.();
    }
  }

  sortDirItems = [
    {
      text: "Ascending",
      value: "asc",
    },
    {
      text: "Descending",
      value: "desc",
    },
  ];

  sortByItems = [
    {
      text: "Relevance",
      value: "relevance",
    },
    {
      text: "# scenes",
      value: "numScenes",
    },
    {
      text: "Added to collection",
      value: "addedOn",
    },
    {
      text: "Alphabetical",
      value: "rawName",
    },
    {
      text: "Bookmarked",
      value: "bookmark",
    },
    {
      text: "Average rating",
      value: "averageRating",
    },
    /* {
      text: "Rating",
      value: "rating"
    } */
  ];

  addLabelsDialog = false;
  addLabelIds: string[] = [];
  addLoader = false;

  subtractLabelsDialog = false;
  subtractLabelIds: string[] = [];
  subtractLoader = false;

  async subtractLabels(): Promise<void> {
    try {
      this.subtractLoader = true;
      for (let i = 0; i < this.selectedStudios.length; i++) {
        const id = this.selectedStudios[i];
        const studio = this.studios.find((sc) => sc._id === id);
        if (studio) {
          await detachLabelsFromItem(id, this.subtractLabelIds);
        }
      }
      // Refresh page
      await this.loadPage();
      this.subtractLabelsDialog = false;
      this.subtractLabelIds = [];
    } catch (error) {
      console.error(error);
    }
    this.subtractLoader = false;
  }

  async addLabels(): Promise<void> {
    try {
      this.addLoader = true;

      for (let i = 0; i < this.selectedStudios.length; i++) {
        const id = this.selectedStudios[i];

        const studio = this.studios.find((img) => img._id === id);
        if (studio) {
          await attachLabelsToItem(id, this.addLabelIds);
        }
      }

      // Refresh page
      await this.loadPage();
      this.addLabelsDialog = false;
      this.addLabelIds = [];
    } catch (error) {
      console.error(error);
    }
    this.addLoader = false;
  }

  labelIDs(indices: number[]) {
    return indices.map((i) => this.allLabels[i]).map((l) => l._id);
  }

  labelNames(ids: string[]) {
    return ids.map((id) => this.allLabels.find((l) => l._id === id)?.name).filter(Boolean);
  }

  async createStudioWithName(name: string) {
    try {
      await ApolloClient.mutate({
        mutation: gql`
          mutation($name: String!) {
            addStudio(name: $name) {
              ...StudioFragment
              numScenes
              thumbnail {
                _id
              }
              labels {
                _id
                name
                color
                aliases
              }
              parent {
                _id
                name
              }
            }
          }
          ${studioFragment}
        `,
        variables: {
          name,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  studioLabels(studio: any) {
    return studio.labels.map((l) => l.name).sort();
  }

  resetPagination() {
    this.searchStateManager.onValueChanged("page", 1);
    this.updateRoute(this.searchStateManager.toQuery(), false, () => {
      // If the query wasn't different, just reset the flag
      this.searchStateManager.refreshed = true;
    });
  }

  getRandom() {
    this.fetchingRandom = true;
    this.fetchPage(1, 1, true, Math.random().toString())
      .then((result) => {
        // @ts-ignore
        this.$router.push(`/studio/${result.items[0]._id}`);
      })
      .catch((err) => {
        this.fetchingRandom = false;
      });
  }

  get pluginLoader() {
    return pluginTaskModule.loader;
  }

  async runPluginsForSelectedStudios() {
    if (this.pluginLoader) {
      // Don't trigger plugins if there is already a task running
      return;
    }

    pluginTaskModule.startLoading({ itemsName: "studio", total: this.selectedStudios.length });

    try {
      for (const id of this.selectedStudios) {
        await this.runPluginsForAStudio(id);
        pluginTaskModule.incrementProgress();
      }
    } catch (error) {
      console.error(error);
    }

    pluginTaskModule.stopLoading();
  }

  async runPluginsForSearch() {
    if (this.pluginLoader) {
      // Don't trigger plugins if there is already a task running
      return;
    }

    pluginTaskModule.startLoading({ itemsName: "studio" });

    try {
      await Studio.iterate(
        (studio) => this.runPluginsForAStudio(studio._id),
        this.fetchQuery,
        ({ iteratedCount, total }) => {
          pluginTaskModule.setProgress({ iteratedCount, total });
        }
      );
    } catch (err) {
      console.error(err);
    }

    pluginTaskModule.stopLoading();
  }

  async runPluginsForAStudio(id: string) {
    try {
      const res = await ApolloClient.mutate({
        mutation: gql`
          mutation($id: String!) {
            runStudioPlugins(id: $id) {
              ...StudioFragment
              numScenes
              thumbnail {
                _id
              }
              labels {
                _id
                name
                color
                aliases
              }
              parent {
                _id
                name
              }
            }
          }
          ${studioFragment}
        `,
        variables: {
          id: id,
        },
      });
      const studio = res.data.runStudioPlugins;
      const studioIndex = this.studios.findIndex((a) => a._id === id);
      if (studioIndex !== -1) {
        this.studios.splice(studioIndex, 1, studio);
      }
    } catch (err) {
      console.error(err);
    }
  }

  isStudioSelected(id: string) {
    return !!this.selectedStudios.includes(id);
  }

  selectStudio(id: string, add: boolean) {
    this.lastSelectionStudioId = id;
    if (add && !this.isStudioSelected(id)) {
      this.selectedStudios.push(id);
    } else {
      this.selectedStudios = this.selectedStudios.filter((i) => i != id);
    }
  }

  toggleSelectionMode() {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedStudios = [];
    }
  }

  @Watch("selectedStudios")
  onSelectedStudiosChange(nextVal: string[]) {
    if (nextVal.length) {
      this.selectionMode = true;
    } else {
      this.selectionMode = false;
    }
  }

  /**
   * @param studio - the clicked studio
   * @param index - the index of the studio in the array
   * @param event - the mouse click event
   * @param forceSelectionChange - whether to force a selection change, instead of opening the studio
   */
  onStudioClick(studio: IStudio, index: number, event: MouseEvent, forceSelectionChange = true) {
    let lastSelectionsceneIndex =
      this.lastSelectionStudioId !== null
        ? this.studios.findIndex((im) => im._id === this.lastSelectionStudioId)
        : index;
    lastSelectionsceneIndex = lastSelectionsceneIndex === -1 ? index : lastSelectionsceneIndex;
    if (event.shiftKey) {
      // Next state is opposite of the clicked studio state
      const nextSelectionState = !this.isStudioSelected(studio._id);
      // Use >= to include the currently clicked studio, so it can be toggled
      // if necessary
      if (index >= lastSelectionsceneIndex) {
        for (let i = lastSelectionsceneIndex + 1; i <= index; i++) {
          this.selectStudio(this.studios[i]._id, nextSelectionState);
        }
      } else if (index < lastSelectionsceneIndex) {
        for (let i = lastSelectionsceneIndex; i >= index; i--) {
          this.selectStudio(this.studios[i]._id, nextSelectionState);
        }
      }
    } else if (forceSelectionChange || event.ctrlKey) {
      this.selectStudio(studio._id, !this.isStudioSelected(studio._id));
    } else if (!forceSelectionChange) {
      this.$router.push(`/studio/${studio._id}`);
    }
  }

  async deleteSelection() {
    this.deleteStudiosLoader = true;

    try {
      await ApolloClient.mutate({
        mutation: gql`
          mutation($ids: [String!]!) {
            removeStudios(ids: $ids)
          }
        `,
        variables: {
          ids: this.selectedStudios,
        },
      });

      this.numResults = Math.max(0, this.numResults - this.selectedStudios.length);
      this.studios = this.studios.filter((st) => !this.selectedStudios.includes(st._id));
      this.selectedStudios = [];
      this.deleteSelectedStudiosDialog = false;
    } catch (err) {
      console.error(err);
    }

    this.deleteStudiosLoader = false;
  }

  get fetchQuery() {
    return {
      query: this.searchState.query || "",
      include: this.searchState.selectedLabels.include,
      exclude: this.searchState.selectedLabels.exclude,
      favorite: this.searchState.favoritesOnly,
      bookmark: this.searchState.bookmarksOnly,
    };
  }

  async fetchPage(page: number, take = 24, random?: boolean, seed?: string) {
    const result = await ApolloClient.query({
      query: gql`
        query($query: StudioSearchQuery!, $seed: String) {
          getStudios(query: $query, seed: $seed) {
            items {
              ...StudioFragment
              numScenes
              thumbnail {
                _id
              }
              labels {
                _id
                name
                color
                aliases
              }
              parent {
                _id
                name
              }
            }
            numItems
            numPages
          }
        }
        ${studioFragment}
      `,
      variables: {
        query: {
          ...this.fetchQuery,
          take,
          page: page - 1,
          sortDir: this.searchState.sortDir,
          sortBy: random ? "$shuffle" : this.searchState.sortBy,
        },
        seed: seed || localStorage.getItem("pm_seed") || "default",
      },
    });

    return result.data.getStudios;
  }

  loadPage() {
    this.fetchLoader = true;

    return this.fetchPage(this.searchState.page)
      .then((result) => {
        this.searchStateManager.refreshed = true;
        this.fetchError = false;
        this.fetchError = false;
        this.numResults = result.numItems;
        this.numPages = result.numPages;
        this.studios = result.items;
      })
      .catch((err) => {
        console.error(err);
        this.fetchError = true;
      })
      .finally(() => {
        this.fetchLoader = false;
      });
  }

  beforeMount() {
    this.searchStateManager.initState(this.$route.query as Dictionary<string>);
    this.updateRoute(this.searchStateManager.toQuery(), true, () => {
      // If the query wasn't different, there will be no route change
      // => manually trigger loadPage
      this.loadPage();
    });

    ApolloClient.query({
      query: gql`
        {
          getLabels {
            _id
            name
            aliases
            color
          }
        }
      `,
    })
      .then((res) => {
        this.allLabels = res.data.getLabels;
        if (!this.allLabels.length) {
          this.searchState.selectedLabels.include = [];
          this.searchState.selectedLabels.exclude = [];
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
</script>

<style lang="scss" scoped>
.not-selected {
  transition: all 0.15s ease-in-out;
  filter: brightness(0.6);
}
</style>
