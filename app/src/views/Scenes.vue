<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Scenes" />

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
          class="mb-2"
          hide-details
          clearable
          color="primary"
          :value="searchState.query"
          @input="searchStateManager.onValueChanged('query', $event)"
          label="Search query"
          single-line
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

          <Rating
            @input="searchStateManager.onValueChanged('ratingFilter', $event)"
            :value="searchState.ratingFilter"
          />
        </div>

        <Divider icon="mdi-label">Labels</Divider>

        <LabelFilter
          @input="searchStateManager.onValueChanged('selectedLabels', $event)"
          class="mt-0"
          :value="searchState.selectedLabels"
          :items="allLabels"
        />

        <Divider icon="mdi-account">{{ actorPlural }}</Divider>

        <ActorSelector
          :value="searchState.selectedActors"
          @input="searchStateManager.onValueChanged('selectedActors', $event)"
          :multiple="true"
        />

        <Divider icon="mdi-camera">Studio</Divider>

        <StudioSelector
          :value="searchState.selectedStudio"
          @input="searchStateManager.onValueChanged('selectedStudio', $event)"
          :multiple="false"
        />

        <Divider icon="mdi-clock">Duration</Divider>

        <v-checkbox
          v-model="searchState.useDuration"
          @change="searchStateManager.onValueChanged('useDuration', $event)"
          label="Filter by duration"
        ></v-checkbox>

        <v-range-slider
          :disabled="!searchState.useDuration"
          hide-details
          :max="durationMax"
          :value="searchState.durationRange"
          @change="searchStateManager.onValueChanged('durationRange', $event)"
          color="primary"
        ></v-range-slider>
        <div class="body-1 med--text text-center">
          <template v-if="searchState.durationRange[0] === durationMax">
            <span class="font-weight-bold"> unlimited</span>
          </template>
          <template v-else>
            <span class="font-weight-bold">{{ searchState.durationRange[0] }}</span> min
          </template>
          -
          <template v-if="searchState.durationRange[1] === durationMax">
            <span class="font-weight-bold"> unlimited</span>
          </template>
          <template v-else>
            <span class="font-weight-bold">{{ searchState.durationRange[1] }}</span> min
          </template>
        </div>

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
          <v-tooltip bottom v-if="!selectedScenes.length">
            <template #activator="{ on }">
              <v-btn icon v-on="on" @click="selectedScenes = scenes.map((im) => im._id)">
                <v-icon>mdi-checkbox-blank-circle-outline</v-icon>
              </v-btn>
            </template>
            Select all
          </v-tooltip>
          <v-tooltip bottom v-else>
            <template #activator="{ on }">
              <v-btn icon v-on="on" @click="selectedScenes = []">
                <v-icon>mdi-checkbox-marked-circle</v-icon>
              </v-btn>
            </template>
            Deselect
          </v-tooltip>

          <div class="title ml-2">
            {{ selectedScenes.length }}
          </div>
        </div>

        <template v-slot:actions>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                :disabled="!selectedScenes.length"
                v-on="on"
                @click="runPluginsForSelectedScenes"
                :loading="pluginLoader"
                icon
              >
                <v-icon>mdi-database-sync</v-icon>
              </v-btn>
            </template>
            Run plugins for selected scenes
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                v-on="on"
                @click="addLabelsDialog = true"
                icon
                :disabled="!selectedScenes.length"
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
                :disabled="!selectedScenes.length"
              >
                <v-icon>mdi-label-off</v-icon>
              </v-btn>
            </template>
            Subtract labels
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                :disabled="!selectedScenes.length"
                v-on="on"
                @click="deleteSelectedScenesDialog = true"
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
          <span class="title font-weight-regular">scenes found</span>
        </div>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" :loading="fetchingRandom" @click="getRandom" icon>
              <v-icon>mdi-shuffle-variant</v-icon>
            </v-btn>
          </template>
          <span>Get random scene</span>
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
          <span>Run plugins for all scenes in current search</span>
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
        <v-spacer />
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
          v-for="(scene, sceneIdx) in scenes"
          :key="scene._id"
          class="pa-1"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          xl="2"
        >
          <scene-card
            :class="
              selectedScenes.length && !selectedScenes.includes(scene._id) ? 'not-selected' : ''
            "
            :showLabels="showCardLabels"
            v-model="scenes[sceneIdx]"
            style="height: 100%"
            @click.native.stop.prevent="onSceneClick(scene, sceneIdx, $event, false)"
          >
            <template v-slot:action="{ hover }">
              <v-fade-transition>
                <v-checkbox
                  v-if="selectionMode || hover || selectedScenes.includes(scene._id)"
                  color="primary"
                  :input-value="selectedScenes.includes(scene._id)"
                  readonly
                  @click.native.stop.prevent="onSceneClick(scene, sceneIdx, $event, true)"
                  class="mt-0"
                  hide-details
                  :contain="true"
                ></v-checkbox>
              </v-fade-transition>
            </template>
          </scene-card>
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

    <v-dialog scrollable v-model="createSceneDialog" max-width="400px">
      <v-card :loading="addSceneLoader">
        <v-card-title>Add new scene</v-card-title>
        <v-card-text style="max-height: 90vh">
          <v-form v-model="validCreation">
            <v-text-field
              :rules="sceneNameRules"
              color="primary"
              v-model="createSceneName"
              placeholder="Name"
            />

            <ActorSelector class="mb-2" v-model="createSceneActors" />

            <v-chip
              label
              @click:close="createSelectedLabels.splice(i, 1)"
              class="mr-1 mb-1"
              close
              small
              outlined
              v-for="(name, i) in labelNames(createSelectedLabels)"
              :key="name"
              >{{ name }}</v-chip
            >
            <v-chip
              label
              :class="`mr-1 mb-1 ${$vuetify.theme.dark ? 'black--text' : 'white--text'}`"
              @click="openLabelSelectorDialog"
              color="primary"
              dark
              small
              >+ Select labels</v-chip
            >
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text class="text-none" :disabled="!validCreation" color="primary" @click="addScene"
            >Add</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <LabelSelectorDialog
      v-model="labelSelectorDialog"
      labelConfirm="OK"
      :loader="false"
      :selectedLabelIds="createSelectedLabels"
      :allLabels="allLabels"
      @changeSelectedLabelIds="createSelectedLabels = $event"
      @confirm="labelSelectorDialog = false"
    >
      <template #title>Select labels for '{{ createSceneName }}' </template>
    </LabelSelectorDialog>

    <!-- <v-dialog :persistent="isUploadingScene" v-model="uploadDialog" max-width="400px">
      <SceneUploader @update-state="isUploadingScene = $event" @uploaded="scenes.unshift($event)" />
    </v-dialog>-->

    <v-dialog v-model="deleteSelectedScenesDialog" max-width="400px">
      <v-card>
        <v-card-title>Really delete {{ selectedScenes.length }} scenes?</v-card-title>
        <v-card-text>
          <template v-if="willDeleteSceneFiles">
            <v-checkbox
              hide-details
              color="error"
              v-model="deleteSceneFiles"
              label="Delete files"
            ></v-checkbox>
            <v-alert v-if="deleteSceneFiles" class="mt-3" type="error"
              >This will absolutely annihilate the original source files on disk
            </v-alert>
          </template>
          <v-checkbox
            color="error"
            v-model="deleteSceneImages"
            label="Delete images as well"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="text-none"
            color="error"
            text
            @click="deleteSelection"
            :loading="deleteScenesLoader"
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
import { Component, Watch } from "vue-property-decorator";
import ApolloClient from "@/apollo";
import gql from "graphql-tag";
import SceneCard from "@/components/Cards/Scene.vue";
import sceneFragment from "@/fragments/scene";
import actorFragment from "@/fragments/actor";
import studioFragment from "@/fragments/studio";
import LabelSelectorDialog from "@/components/LabelSelectorDialog.vue";
import { contextModule } from "@/store/context";
import ActorSelector from "@/components/ActorSelector.vue";
import StudioSelector from "@/components/StudioSelector.vue";
import SceneUploader from "@/components/SceneUploader.vue";
import IScene from "@/types/scene";
import IActor from "@/types/actor";
import ILabel from "@/types/label";
import DrawerMixin from "@/mixins/drawer";
import { mixins } from "vue-class-component";
import { Route } from "vue-router";
import { Dictionary } from "vue-router/types/router";
import { SearchStateManager, isQueryDifferent } from "../util/searchState";
import { Scene } from "@/api/scene";
import { pluginTaskModule } from "@/store/pluginTask";
import { attachLabelsToItem, detachLabelsFromItem } from "@/api/label";

@Component({
  components: {
    SceneCard,
    LabelSelectorDialog,
    ActorSelector,
    SceneUploader,
    StudioSelector,
  },
})
export default class SceneList extends mixins(DrawerMixin) {
  get showSidenav() {
    return contextModule.showSidenav;
  }

  scenes = [] as IScene[];

  rerollSeed() {
    const seed = Math.random().toString(36);
    localStorage.setItem("pm_seed", seed);
    if (this.searchState.sortBy === "$shuffle") {
      this.loadPage();
    }
    return seed;
  }

  fetchLoader = false;
  fetchError = false;
  fetchingRandom = false;
  numResults = 0;
  numPages = 0;
  selectionMode = false;

  searchStateManager = new SearchStateManager<{
    page: number;
    query: string;
    durationRange: number[];
    favoritesOnly: boolean;
    bookmarksOnly: boolean;
    ratingFilter: number;
    selectedLabels: { include: string[]; exclude: string[] };
    selectedActors: IActor[];
    selectedStudio: { _id: string; name: string };
    useDuration: boolean;
    sortBy: string;
    sortDir: string;
  }>({
    localStorageNamer: (key: string) => `pm_scene${key[0].toUpperCase()}${key.substr(1)}`,
    props: {
      page: {
        default: () => 1,
      },
      query: true,
      favoritesOnly: { default: () => false },
      bookmarksOnly: { default: () => false },
      ratingFilter: { default: () => 0 },
      selectedLabels: { default: () => ({ include: [], exclude: [] }) },
      selectedActors: {
        default: () => [],
        serialize: (actors: IActor[]) =>
          JSON.stringify(
            actors.map((a) => ({
              _id: a._id,
              name: a.name,
              avatar: a.avatar,
              thumbnail: a.thumbnail,
            }))
          ),
      },
      selectedStudio: {
        serialize: (val: any) => (val ? JSON.stringify({ _id: val._id, name: val.name }) : ""),
      },
      useDuration: { default: () => false },
      durationRange: {
        default: () => [0, this.durationMax],
      },
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

  get selectedActorIds() {
    return this.searchState.selectedActors.map((ac) => ac._id);
  }

  allLabels = [] as ILabel[];

  validCreation = false;
  createSceneDialog = false;
  createSceneName = "";
  createSceneActors = [] as IActor[];
  createSelectedLabels: string[] = [];
  labelSelectorDialog = false;
  addSceneLoader = false;
  deleteScenesLoader = false;

  sceneNameRules = [(v) => (!!v && !!v.length) || "Invalid scene name"];

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
        name: "scenes",
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

  durationMax = parseInt(localStorage.getItem("pm_durationFilterMax") || "180") || 180;

  sortDir = localStorage.getItem("pm_sceneSortDir") || "desc";
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

  sortBy = localStorage.getItem("pm_sceneSortBy") || "relevance";
  sortByItems = [
    {
      text: "Relevance",
      value: "relevance",
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
      text: "Last viewed",
      value: "lastViewedOn",
    },
    {
      text: "Rating",
      value: "rating",
    },
    {
      text: "Views",
      value: "numViews",
    },
    {
      text: `# ${this.actorPlural?.toLowerCase() ?? ""}`,
      value: "numActors",
    },
    {
      text: "Duration",
      value: "duration",
    },
    {
      text: "Resolution",
      value: "resolution",
    },
    {
      text: "Size",
      value: "size",
    },
    {
      text: "Release date",
      value: "releaseDate",
    },
    {
      text: "Bookmarked",
      value: "bookmark",
    },
    {
      text: "Random",
      value: "$shuffle",
    },
  ];

  uploadDialog = false;
  isUploadingScene = false;

  selectedScenes = [] as string[];
  lastSelectionSceneId: string | null = null;
  deleteSelectedScenesDialog = false;
  deleteSceneFiles = false;
  deleteSceneImages = false;

  addLabelsDialog = false;
  addLabelIds: string[] = [];
  addLoader = false;

  subtractLabelsDialog = false;
  subtractLabelIds: string[] = [];
  subtractLoader = false;

  async subtractLabels(): Promise<void> {
    try {
      this.subtractLoader = true;
      for (let i = 0; i < this.selectedScenes.length; i++) {
        const id = this.selectedScenes[i];
        const scene = this.scenes.find((sc) => sc._id === id);
        if (scene) {
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

      for (let i = 0; i < this.selectedScenes.length; i++) {
        const id = this.selectedScenes[i];

        const scene = this.scenes.find((img) => img._id === id);
        if (scene) {
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

  labelClasses(label: ILabel) {
    if (this.searchState.selectedLabels.include.includes(label._id))
      return "font-weight-bold primary--text";
    else if (this.searchState.selectedLabels.exclude.includes(label._id))
      return "font-weight-bold error--text";
    return "";
  }

  get actorPlural() {
    return contextModule.actorPlural;
  }

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  get willDeleteSceneFiles() {
    return this.selectedScenes.some((id) => {
      const scene = this.scenes.find((sc) => sc._id === id);
      return scene && !!scene["path"];
    });
  }

  async deleteSelection() {
    this.deleteScenesLoader = true;

    try {
      ApolloClient.mutate({
        mutation: gql`
          mutation ($ids: [String!]!, $deleteImages: Boolean, $deleteFile: Boolean) {
            removeScenes(ids: $ids, deleteImages: $deleteImages, deleteFile: $deleteFile)
          }
        `,
        variables: {
          ids: this.selectedScenes,
          deleteImages: this.deleteSceneImages,
          deleteFile: this.deleteSceneFiles,
        },
      });

      this.numResults = Math.max(0, this.numResults - this.selectedScenes.length);
      this.scenes = this.scenes.filter((scene) => !this.selectedScenes.includes(scene._id));
      this.selectedScenes = [];
      this.deleteSelectedScenesDialog = false;
      this.deleteSceneImages = false;
      this.deleteSceneFiles = false;
    } catch (err) {
      console.error(err);
    }

    this.deleteScenesLoader = false;
  }

  openUploadDialog() {
    this.uploadDialog = true;
  }

  labelNames(ids: string[]) {
    return ids.map((id) => this.allLabels.find((l) => l._id === id)?.name).filter(Boolean);
  }

  openLabelSelectorDialog() {
    if (!this.allLabels.length) {
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
          this.labelSelectorDialog = true;
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      this.labelSelectorDialog = true;
    }
  }

  addScene() {
    this.addSceneLoader = true;
    ApolloClient.mutate({
      mutation: gql`
        mutation ($name: String!, $labels: [String!], $actors: [String!]) {
          addScene(name: $name, labels: $labels, actors: $actors) {
            ...SceneFragment
            actors {
              ...ActorFragment
            }
            studio {
              ...StudioFragment
            }
          }
        }
        ${sceneFragment}
        ${actorFragment}
        ${studioFragment}
      `,
      variables: {
        name: this.createSceneName,
        actors: this.createSceneActors.map((a) => a._id),
        labels: this.createSelectedLabels,
      },
    })
      .then((res) => {
        this.loadPage();
        this.createSceneDialog = false;
        this.createSceneName = "";
        this.createSceneActors = [];
        this.createSelectedLabels = [];
      })
      .catch(() => {})
      .finally(() => {
        this.addSceneLoader = false;
      });
  }

  openCreateDialog() {
    this.createSceneDialog = true;
  }

  sceneLabels(scene: any) {
    return scene.labels.map((l) => l.name).sort();
  }

  sceneActorNames(scene: any) {
    return scene.actors.map((a) => a.name).join(", ");
  }

  sceneThumbnail(scene: any) {
    if (scene.thumbnail)
      return `/api/media/image/${scene.thumbnail._id}?password=${localStorage.getItem("password")}`;
    return "";
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
        this.$router.push({ name: "scene-details", params: { id: result.items[0]._id } });
      })
      .catch((err) => {
        this.fetchingRandom = false;
      });
  }

  get pluginLoader() {
    return pluginTaskModule.loader;
  }

  async runPluginsForSelectedScenes() {
    if (this.pluginLoader) {
      // Don't trigger plugins if there is already a task running
      return;
    }

    pluginTaskModule.startLoading({ itemsName: "scene", total: this.selectedScenes.length });

    try {
      for (const id of this.selectedScenes) {
        await this.runPluginsForAScene(id);
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

    pluginTaskModule.startLoading({ itemsName: "scene" });

    try {
      await Scene.iterate(
        (scene) => this.runPluginsForAScene(scene._id),
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

  async runPluginsForAScene(id: string) {
    try {
      const res = await ApolloClient.mutate({
        mutation: gql`
          mutation ($id: String!) {
            runScenePlugins(id: $id) {
              ...SceneFragment
              actors {
                ...ActorFragment
              }
              studio {
                ...StudioFragment
              }
            }
          }
          ${sceneFragment}
          ${actorFragment}
          ${studioFragment}
        `,
        variables: {
          id: id,
        },
      });
      const scene = res.data.runScenePlugins;
      const sceneIndex = this.scenes.findIndex((a) => a._id === id);
      if (sceneIndex !== -1) {
        this.scenes.splice(sceneIndex, 1, scene);
      }
    } catch (err) {
      console.error(err);
    }
  }

  isSceneSelected(id: string) {
    return !!this.selectedScenes.includes(id);
  }

  selectScene(id: string, add: boolean) {
    this.lastSelectionSceneId = id;
    if (add && !this.isSceneSelected(id)) {
      this.selectedScenes.push(id);
    } else {
      this.selectedScenes = this.selectedScenes.filter((i) => i != id);
    }
  }

  toggleSelectionMode() {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedScenes = [];
    }
  }

  @Watch("selectedScenes")
  onSelectedScenesChange(nextVal: string[]) {
    if (nextVal.length) {
      this.selectionMode = true;
    } else {
      this.selectionMode = false;
    }
  }

  /**
   * @param scene - the clicked scene
   * @param index - the index of the scene in the array
   * @param event - the mouse click event
   * @param forceSelectionChange - whether to force a selection change, instead of opening the scene
   */
  onSceneClick(scene: IScene, index: number, event: MouseEvent, forceSelectionChange = true) {
    let lastSelectionsceneIndex =
      this.lastSelectionSceneId !== null
        ? this.scenes.findIndex((im) => im._id === this.lastSelectionSceneId)
        : index;
    lastSelectionsceneIndex = lastSelectionsceneIndex === -1 ? index : lastSelectionsceneIndex;
    if (event.shiftKey) {
      // Next state is opposite of the clicked scene state
      const nextSelectionState = !this.isSceneSelected(scene._id);
      // Use >= to include the currently clicked scene, so it can be toggled
      // if necessary
      if (index >= lastSelectionsceneIndex) {
        for (let i = lastSelectionsceneIndex + 1; i <= index; i++) {
          this.selectScene(this.scenes[i]._id, nextSelectionState);
        }
      } else if (index < lastSelectionsceneIndex) {
        for (let i = lastSelectionsceneIndex; i >= index; i--) {
          this.selectScene(this.scenes[i]._id, nextSelectionState);
        }
      }
    } else if (forceSelectionChange || event.ctrlKey) {
      this.selectScene(scene._id, !this.isSceneSelected(scene._id));
    } else if (!forceSelectionChange) {
      this.$router.push(`/scene/${scene._id}`);
    }
  }

  get fetchQuery() {
    return {
      query: this.searchState.query || "",
      actors: this.selectedActorIds,
      include: this.searchState.selectedLabels.include,
      exclude: this.searchState.selectedLabels.exclude,
      favorite: this.searchState.favoritesOnly,
      bookmark: this.searchState.bookmarksOnly,
      rating: this.searchState.ratingFilter,
      durationMin:
        this.searchState.useDuration && this.searchState.durationRange[0] !== this.durationMax
          ? this.searchState.durationRange[0] * 60
          : null,
      durationMax:
        this.searchState.useDuration && this.searchState.durationRange[1] !== this.durationMax
          ? this.searchState.durationRange[1] * 60
          : null,
      studios: this.searchState.selectedStudio ? this.searchState.selectedStudio._id : null,
    };
  }

  async fetchPage(page: number, take = 24, random?: boolean, seed?: string) {
    const result = await ApolloClient.query({
      query: gql`
        query ($query: SceneSearchQuery!, $seed: String) {
          getScenes(query: $query, seed: $seed) {
            items {
              ...SceneFragment
              actors {
                ...ActorFragment
              }
              studio {
                ...StudioFragment
              }
            }
            numItems
            numPages
          }
        }
        ${sceneFragment}
        ${actorFragment}
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

    return result.data.getScenes;
  }

  loadPage() {
    this.fetchLoader = true;
    this.selectedScenes = [];

    return this.fetchPage(this.searchState.page)
      .then((result) => {
        this.searchStateManager.refreshed = true;
        this.fetchError = false;
        this.numResults = result.numItems;
        this.numPages = result.numPages;
        this.scenes = result.items;
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

<style lang="scss">
.not-selected {
  transition: all 0.15s ease-in-out;
  filter: brightness(0.6);
}
</style>
