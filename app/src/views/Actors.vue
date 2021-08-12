<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle @value="actorPlural" />
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
          clearable
          color="primary"
          :value="searchState.query"
          @input="searchStateManager.onValueChanged('query', $event)"
          label="Search query"
          class="mb-2"
          hide-details
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

          <v-spacer />

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

        <Divider icon="mdi-sort">Sort</Divider>

        <v-select
          solo
          flat
          single-line
          color="primary"
          item-text="text"
          item-value="value"
          :value="searchState.sortBy"
          @change="searchStateManager.onValueChanged('sortBy', $event)"
          placeholder="Sort by..."
          :items="sortByItems"
          class="mt-0 pt-0 mb-2"
          :hint="sortDescription"
          persistent-hint
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

        <Divider icon="mdi-flag">Nationality</Divider>

        <v-autocomplete
          placeholder="Filter by nationality"
          hide-details
          color="primary"
          solo
          flat
          single-line
          :value="searchState.countryFilter"
          @change="searchStateManager.onValueChanged('countryFilter', $event)"
          :items="countries"
          item-text="name"
          item-value="alpha2"
          clearable
        ></v-autocomplete>

        <div class="mt-3 text-center">
          <v-btn
            @click="openCustomFilterDialog"
            text
            class="text-center text-none"
            color="primary"
            >{{
              searchState.customFilter.length
                ? `${searchState.customFilter.length} custom filters`
                : "Filter custom fields"
            }}</v-btn
          >
        </div>
      </v-container>
    </v-navigation-drawer>

    <v-expand-transition>
      <v-banner app sticky class="mb-2" v-if="selectionMode">
        <div class="d-flex align-center">
          <v-tooltip bottom v-if="!selectedActors.length">
            <template #activator="{ on }">
              <v-btn icon v-on="on" @click="selectedActors = actors.map((im) => im._id)">
                <v-icon>mdi-checkbox-blank-circle-outline</v-icon>
              </v-btn>
            </template>
            Select all
          </v-tooltip>
          <v-tooltip bottom v-else>
            <template #activator="{ on }">
              <v-btn icon v-on="on" @click="selectedActors = []">
                <v-icon>mdi-checkbox-marked-circle</v-icon>
              </v-btn>
            </template>
            Deselect
          </v-tooltip>

          <div class="title ml-2">
            {{ selectedActors.length }}
          </div>
        </div>

        <template v-slot:actions>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                :disabled="!selectedActors.length"
                v-on="on"
                @click="runPluginsForSelectedActors"
                :loading="pluginLoader"
                icon
              >
                <v-icon>mdi-database-sync</v-icon>
              </v-btn>
            </template>
            Run plugins for selected {{ (actorPlural || "").toLowerCase() }}
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                v-on="on"
                @click="addLabelsDialog = true"
                icon
                :disabled="!selectedActors.length"
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
                :disabled="!selectedActors.length"
              >
                <v-icon>mdi-label-off</v-icon>
              </v-btn>
            </template>
            Subtract labels
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                :disabled="!selectedActors.length"
                v-on="on"
                @click="deleteSelectedActorsDialog = true"
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
          <span class="title font-weight-regular">
            <template v-if="numResults === 1">{{ actorSingular.toLowerCase() }}</template>
            <template v-else>{{ actorPlural.toLowerCase() }}</template> found
          </span>
        </div>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="openCreateDialog" icon>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <span>Add {{ actorSingular.toLowerCase() }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" @click="bulkImportDialog = true" icon>
              <v-icon>mdi-file-import</v-icon>
            </v-btn>
          </template>
          <span>Bulk add {{ actorPlural.toLowerCase() }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" :loading="fetchingRandom" @click="getRandom" icon>
              <v-icon>mdi-shuffle-variant</v-icon>
            </v-btn>
          </template>
          <span>Get random {{ actorSingular.toLowerCase() }}</span>
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
          <span>Run plugins for all {{ (actorPlural || "").toLowerCase() }} in current search</span>
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
          />
        </div>
      </div>
      <v-row v-if="!fetchLoader && numResults">
        <v-col
          class="pa-1"
          v-for="(actor, actorIdx) in actors"
          :key="actor._id"
          cols="6"
          sm="6"
          md="4"
          lg="3"
          xl="2"
        >
          <actor-card
            :showLabels="showCardLabels"
            v-model="actors[actorIdx]"
            :class="
              selectedActors.length && !selectedActors.includes(actor._id) ? 'not-selected' : ''
            "
            @click.native.stop.prevent="onActorClick(actor, actorIdx, $event, false)"
          >
            <template v-slot:action="{ hover }">
              <v-fade-transition>
                <v-checkbox
                  v-if="selectionMode || hover || selectedActors.includes(actor._id)"
                  color="primary"
                  :input-value="selectedActors.includes(actor._id)"
                  readonly
                  @click.native.stop.prevent="onActorClick(actor, actorIdx, $event, true)"
                  class="mt-0"
                  hide-details
                  :contain="true"
                />
              </v-fade-transition>
            </template>
          </actor-card>
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
          @click="loadPage(page)"
          >Load</v-btn
        >
      </div>
    </div>

    <v-dialog v-model="createActorDialog" max-width="400px">
      <v-card :loading="addActorLoader">
        <v-card-title>Add new {{ actorSingular.toLowerCase() }}</v-card-title>
        <v-card-text>
          <v-form v-model="validCreation">
            <v-text-field
              :rules="actorNameRules"
              color="primary"
              v-model="createActorName"
              placeholder="Name"
            />

            <v-combobox
              color="primary"
              multiple
              chips
              v-model="createActorAliases"
              placeholder="Alias names"
            />

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
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn text class="text-none" :disabled="!validCreation" color="primary" @click="addActor"
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
      <template #title> Select labels for '{{ createActorName }}' </template>
    </LabelSelectorDialog>

    <v-dialog :persistent="bulkLoader" scrollable v-model="bulkImportDialog" max-width="400px">
      <v-card :loading="bulkLoader">
        <v-card-title>Bulk import {{ actorSingular.toLowerCase() }} names</v-card-title>

        <v-card-text style="max-height: 400px">
          <v-textarea
            color="primary"
            v-model="actorsBulkText"
            auto-grow
            :rows="3"
            @placeholder="actorSingular.toLowerCase() + ' names'"
            persistent-hint
            @hint="'1 ' + actorSingular.toLowerCase() + ' name per line'"
          ></v-textarea>
        </v-card-text>
        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="runBulkImport"
            text
            color="primary"
            class="text-none"
            :disabled="!actorsBulkImport.length"
            >Add {{ actorsBulkImport.length }} {{ actorPlural.toLowerCase() }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteSelectedActorsDialog" max-width="400px">
      <v-card>
        <v-card-title>Really delete {{ selectedActors.length }} {{ (actorPlural || "").toLowerCase() }}?</v-card-title>
        <v-card-text
          >Scenes and images featuring the {{ (actorPlural || "").toLowerCase() }} will stay in your collection.</v-card-text
        >
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="text-none"
            color="error"
            text
            @click="deleteSelection"
            :loading="deleteActorsLoader"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog scrollable max-width="750px" v-model="customDialog">
      <v-card v-if="customDialog">
        <v-card-title>Filter custom fields</v-card-title>
        <v-card-text style="max-height: 500px">
          <CustomFieldFilter v-model="customFilterTemp" :fields="fields" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :disabled="customFilterTempInvalid"
            @click="onCustomChange"
            text
            color="primary"
            class="text-none"
            >Apply</v-btn
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
import ActorCard from "@/components/Cards/Actor.vue";
import LabelSelectorDialog from "@/components/LabelSelectorDialog.vue";
import actorFragment from "@/fragments/actor";
import { contextModule } from "@/store/context";
import IActor from "@/types/actor";
import ILabel from "@/types/label";
import DrawerMixin from "@/mixins/drawer";
import { mixins } from "vue-class-component";
import CustomFieldFilter from "@/components/CustomFieldFilter.vue";
import countries from "@/util/countries";
import { SearchStateManager, isQueryDifferent } from "../util/searchState";
import { Dictionary, Route } from "vue-router/types/router";
import { Actor } from "@/api/actor";
import { pluginTaskModule } from "@/store/pluginTask";
import { attachLabelsToItem, detachLabelsFromItem } from "@/api/label";

@Component({
  components: {
    ActorCard,
    LabelSelectorDialog,
    CustomFieldFilter,
  },
})
export default class ActorList extends mixins(DrawerMixin) {
  get countries() {
    return countries;
  }

  get showSidenav() {
    return contextModule.showSidenav;
  }

  get actorSingular() {
    return contextModule.actorSingular;
  }

  get actorPlural() {
    return contextModule.actorPlural;
  }

  rerollSeed() {
    const seed = Math.random().toString(36);
    localStorage.setItem("pm_seed", seed);
    if (this.searchState.sortBy === "$shuffle") {
      this.loadPage();
    }
    return seed;
  }

  actors = [] as IActor[];

  fields = [] as any[];
  fetchLoader = false;
  fetchError = false;
  fetchingRandom = false;
  numResults = 0;
  numPages = 0;
  selectionMode = false;

  searchStateManager = new SearchStateManager<{
    page: number;
    query: string;
    favoritesOnly: boolean;
    bookmarksOnly: boolean;
    ratingFilter: number;
    selectedLabels: { include: string[]; exclude: string[] };
    sortBy: string;
    sortDir: string;
    countryFilter: string;
    customFilter: { id: string; op: string; value: string }[];
  }>({
    localStorageNamer: (key: string) => `pm_actor${key[0].toUpperCase()}${key.substr(1)}`,
    props: {
      page: {
        default: () => 1,
      },
      query: true,
      favoritesOnly: { default: () => false },
      bookmarksOnly: { default: () => false },
      ratingFilter: { default: () => 0 },
      selectedLabels: { default: () => ({ include: [], exclude: [] }) },
      sortBy: { default: () => "relevance" },
      sortDir: {
        default: () => "desc",
      },
      countryFilter: true,
      customFilter: { default: () => [] },
    },
  });

  jumpPage: string | null = null;

  get searchState() {
    return this.searchStateManager.state;
  }

  actorsBulkText = "" as string | null;
  bulkImportDialog = false;
  bulkLoader = false;

  customFilterTemp: { id: string; op: string; value: string }[] = [];
  customDialog = false;

  get customFilterTempInvalid() {
    return this.customFilterTemp.some((el) => !el.op || !el.value);
  }

  openCustomFilterDialog() {
    this.customFilterTemp = [...this.searchState.customFilter];
    this.customDialog = true;
  }

  onCustomChange() {
    this.searchStateManager.onValueChanged("customFilter", [...this.customFilterTemp]);
    this.customDialog = false;
    this.resetPagination();
  }

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  async runBulkImport() {
    this.bulkLoader = true;

    try {
      for (const name of this.actorsBulkImport) {
        await this.createActorWithName(name);
      }
      this.loadPage();
      this.bulkImportDialog = false;
    } catch (error) {
      console.error(error);
    }

    this.actorsBulkText = "";
    this.bulkLoader = false;
  }

  get actorsBulkImport() {
    if (this.actorsBulkText) return this.actorsBulkText.split("\n").filter(Boolean);
    return [];
  }

  allLabels = [] as ILabel[];

  validCreation = false;
  createActorDialog = false;
  createActorName = "";
  createActorAliases = [] as string[];
  createSelectedLabels: string[] = [];
  labelSelectorDialog = false;
  addActorLoader = false;
  deleteActorsLoader = false;

  actorNameRules = [(v) => (!!v && !!v.length) || "Invalid name"];

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
        name: "actors",
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

  get sortDescription() {
    return (
      {
        relevance: "Sorts by relevance",
        addedOn: "Sorts by creation date",
        rating: `Sorts by ${this.actorSingular?.toLowerCase() ?? ""} rating`,
        averageRating: "Sort by average scene rating",
        score: "Sorts by computed score",
        numScenes: "Sorts by number of scenes",
        numViews: "Sorts by number of views",
        bornOn: `Sorts by ${this.actorSingular?.toLowerCase() ?? ""} age`,
        bookmark: "Sorts by bookmark date",
        $shuffle: `Shuffles ${this.actorPlural?.toLowerCase() ?? ""}`,
      }[this.searchState.sortBy] || "Missing description"
    );
  }

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
      text: "Age",
      value: "bornOn",
    },
    {
      text: "Rating",
      value: "rating",
    },
    {
      text: "Average rating",
      value: "averageRating",
    },
    {
      text: "Score",
      value: "score",
    },
    {
      text: "# scenes",
      value: "numScenes",
    },
    {
      text: "Views",
      value: "numViews",
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

  addLabelsDialog = false;
  addLabelIds: string[] = [];
  addLoader = false;

  subtractLabelsDialog = false;
  subtractLabelIds: string[] = [];
  subtractLoader = false;

  async subtractLabels(): Promise<void> {
    try {
      this.subtractLoader = true;
      for (let i = 0; i < this.selectedActors.length; i++) {
        const id = this.selectedActors[i];
        const actor = this.actors.find((sc) => sc._id === id);
        if (actor) {
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

      for (let i = 0; i < this.selectedActors.length; i++) {
        const id = this.selectedActors[i];

        const actor = this.actors.find((img) => img._id === id);
        if (actor) {
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

  createActorWithName(name: string) {
    return new Promise<void>((resolve, reject) => {
      ApolloClient.mutate({
        mutation: gql`
          mutation ($name: String!) {
            addActor(name: $name) {
              ...ActorFragment
              labels {
                _id
                name
                color
                aliases
              }
              thumbnail {
                _id
                color
              }
              altThumbnail {
                _id
              }
              numScenes
            }
          }
          ${actorFragment}
        `,
        variables: {
          name,
        },
      })
        .then((res) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  addActor() {
    this.addActorLoader = true;
    ApolloClient.mutate({
      mutation: gql`
        mutation ($name: String!, $aliases: [String!], $labels: [String!]) {
          addActor(name: $name, aliases: $aliases, labels: $labels) {
            ...ActorFragment
            labels {
              _id
              name
              color
              aliases
            }
            thumbnail {
              _id
              color
            }
            altThumbnail {
              _id
            }
            numScenes
          }
        }
        ${actorFragment}
      `,
      variables: {
        name: this.createActorName,
        aliases: this.createActorAliases,
        labels: this.createSelectedLabels,
      },
    })
      .then((res) => {
        this.loadPage();
        this.createActorDialog = false;
        this.createActorName = "";
        this.createActorAliases = [];
        this.createSelectedLabels = [];
      })
      .catch(() => {})
      .finally(() => {
        this.addActorLoader = false;
      });
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

  labelNames(ids: string[]) {
    return ids.map((id) => this.allLabels.find((l) => l._id === id)?.name).filter(Boolean);
  }

  openCreateDialog() {
    this.createActorDialog = true;
  }

  actorLabels(actor: any) {
    return actor.labels.map((l) => l.name);
  }

  actorActorNames(actor: any) {
    return actor.actors.map((a) => a.name).join(", ");
  }

  actorThumbnail(actor: any) {
    if (actor.thumbnail)
      return `/api/media/image/${actor.thumbnail._id}?password=${localStorage.getItem("password")}`;
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
        this.$router.push(`/actor/${result.items[0]._id}`);
      })
      .catch((err) => {
        this.fetchingRandom = false;
      });
  }

  get pluginLoader() {
    return pluginTaskModule.loader;
  }

  async runPluginsForSelectedActors() {
    if (this.pluginLoader) {
      // Don't trigger plugins if there is already a task running
      return;
    }

    pluginTaskModule.startLoading({ itemsName: "actor", total: this.selectedActors.length });

    try {
      for (const id of this.selectedActors) {
        await this.runPluginsForAnActor(id);
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

    pluginTaskModule.startLoading({ itemsName: "actor" });

    try {
      await Actor.iterate(
        (actor) => this.runPluginsForAnActor(actor._id),
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

  async runPluginsForAnActor(id: string) {
    try {
      const res = await ApolloClient.mutate({
        mutation: gql`
          mutation ($id: String!) {
            runActorPlugins(id: $id) {
              ...ActorFragment
              labels {
                _id
                name
                color
                aliases
              }
              thumbnail {
                _id
                color
              }
              altThumbnail {
                _id
              }
              numScenes
            }
          }
          ${actorFragment}
        `,
        variables: {
          id: id,
        },
      });
      const actor = res.data.runActorPlugins;
      const actorIndex = this.actors.findIndex((a) => a._id === id);
      if (actorIndex !== -1) {
        this.actors.splice(actorIndex, 1, actor);
      }
    } catch (err) {
      console.error(err);
    }
  }

  selectedActors = [] as string[];
  lastSelectionActorId: string | null = null;
  deleteSelectedActorsDialog = false;

  isActorSelected(id: string) {
    return !!this.selectedActors.includes(id);
  }

  selectActor(id: string, add: boolean) {
    this.lastSelectionActorId = id;
    if (add && !this.isActorSelected(id)) {
      this.selectedActors.push(id);
    } else {
      this.selectedActors = this.selectedActors.filter((i) => i != id);
    }
  }

  toggleSelectionMode() {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedActors = [];
    }
  }

  @Watch("selectedActors")
  onSelectedActorsChange(nextVal: string[]) {
    if (nextVal.length) {
      this.selectionMode = true;
    } else {
      this.selectionMode = false;
    }
  }

  /**
   * @param actor - the clicked actor
   * @param index - the index of the actor in the array
   * @param event - the mouse click event
   * @param forceSelectionChange - whether to force a selection change, instead of opening the actor
   */
  onActorClick(actor: IActor, index: number, event: MouseEvent, forceSelectionChange = true) {
    let lastSelectionActorIndex =
      this.lastSelectionActorId !== null
        ? this.actors.findIndex((im) => im._id === this.lastSelectionActorId)
        : index;
    lastSelectionActorIndex = lastSelectionActorIndex === -1 ? index : lastSelectionActorIndex;

    if (event.shiftKey) {
      // Next state is opposite of the clicked scene state
      const nextSelectionState = !this.isActorSelected(actor._id);

      // Use >= to include the currently clicked scene, so it can be toggled
      // if necessary
      if (index >= lastSelectionActorIndex) {
        for (let i = lastSelectionActorIndex + 1; i <= index; i++) {
          this.selectActor(this.actors[i]._id, nextSelectionState);
        }
      } else if (index < lastSelectionActorIndex) {
        for (let i = lastSelectionActorIndex; i >= index; i--) {
          this.selectActor(this.actors[i]._id, nextSelectionState);
        }
      }
    } else if (forceSelectionChange || event.ctrlKey) {
      this.selectActor(actor._id, !this.isActorSelected(actor._id));
    } else if (!forceSelectionChange) {
      this.$router.push(`/actor/${actor._id}`);
    }
  }

  async deleteSelection() {
    this.deleteActorsLoader = true;

    try {
      await ApolloClient.mutate({
        mutation: gql`
          mutation ($ids: [String!]!) {
            removeActors(ids: $ids)
          }
        `,
        variables: {
          ids: this.selectedActors,
        },
      });

      this.numResults = Math.max(0, this.numResults - this.selectedActors.length);
      this.actors = this.actors.filter((act) => !this.selectedActors.includes(act._id));
      this.selectedActors = [];
      this.deleteSelectedActorsDialog = false;
    } catch (err) {
      console.error(err);
    }

    this.deleteActorsLoader = false;
  }

  get fetchQuery() {
    return {
      query: this.searchState.query || "",
      include: this.searchState.selectedLabels.include,
      exclude: this.searchState.selectedLabels.exclude,
      nationality: this.searchState.countryFilter || null,
      favorite: this.searchState.favoritesOnly,
      bookmark: this.searchState.bookmarksOnly,
      rating: this.searchState.ratingFilter,
      custom: this.searchState.customFilter,
    };
  }

  async fetchPage(page: number, take = 24, random?: boolean, seed?: string) {
    let sortDir = this.searchState.sortDir;

    // Flip sort direction
    if (this.searchState.sortBy === "bornOn") {
      sortDir = sortDir === "desc" ? "asc" : "desc";
    }

    const result = await ApolloClient.query({
      query: gql`
        query ($query: ActorSearchQuery!, $seed: String) {
          getActors(query: $query, seed: $seed) {
            items {
              ...ActorFragment
              labels {
                _id
                name
                color
                aliases
              }
              thumbnail {
                _id
                color
              }
              altThumbnail {
                _id
              }
              numScenes
            }
            numItems
            numPages
          }
        }
        ${actorFragment}
      `,
      variables: {
        query: {
          ...this.fetchQuery,
          take,
          page: page - 1,
          sortDir,
          sortBy: random ? "$shuffle" : this.searchState.sortBy,
        },
        seed: seed || localStorage.getItem("pm_seed") || "default",
      },
    });

    return result.data.getActors;
  }

  loadPage() {
    this.fetchLoader = true;

    return this.fetchPage(this.searchState.page)
      .then((result) => {
        this.searchStateManager.refreshed = true;
        this.fetchError = false;
        this.numResults = result.numItems;
        this.numPages = result.numPages;
        this.actors = result.items;
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
          getCustomFields(target: ACTORS) {
            _id
            name
            type
            values
            unit
            target
          }
        }
      `,
    })
      .then((res) => {
        this.fields = res.data.getCustomFields;
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
