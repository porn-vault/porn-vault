<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Markers" />

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
          class="mb-2"
          hide-details
          clearable
          color="primary"
          :value="searchState.query"
          @input="searchStateManager.onValueChanged('query', $event)"
          label="Search query"
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
        {{ selectedMarkers.length }} markers selected
        <template v-slot:actions>
          <v-flex class="flex-wrap justify-end" shrink>
            <v-btn
              :disabled="!selectedMarkers.length"
              text
              @click="selectedMarkers = []"
              class="text-none"
              >Deselect</v-btn
            >
            <v-btn
              :disabled="selectedMarkers.length === markers.length"
              text
              @click="selectedMarkers = markers.map((act) => act._id)"
              class="text-none"
              >Select all</v-btn
            >
            <v-btn
              :disabled="!selectedMarkers.length"
              @click="deleteSelectedMarkersDialog = true"
              text
              class="text-none"
              color="error"
              >Delete</v-btn
            >
          </v-flex>
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
          <span class="title font-weight-regular">markers found</span>
        </div>
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
      <v-row dense v-if="!fetchLoader && numResults">
        <v-col
          class="mb-1"
          v-for="(marker, markerIdx) in markers"
          :key="marker._id"
          cols="6"
          md="4"
          lg="3"
          xl="2"
        >
          <MarkerCard
            v-model="markers[markerIdx]"
            :showLabels="showCardLabels"
            @click.native.stop.prevent="onMarkerClick(marker, markerIdx, $event, false)"
          >
            <template v-slot:action="{ hover }">
              <v-fade-transition>
                <v-checkbox
                  v-if="selectionMode || hover || selectedMarkers.includes(marker._id)"
                  color="primary"
                  :input-value="selectedMarkers.includes(marker._id)"
                  readonly
                  @click.native.stop.prevent="onMarkerClick(marker, markerIdx, $event, true)"
                  class="mt-0"
                  hide-details
                  :contain="true"
                />
              </v-fade-transition>
            </template>
          </MarkerCard>
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

    <v-dialog v-model="deleteSelectedMarkersDialog" max-width="400px">
      <v-card>
        <v-card-title>Really delete {{ selectedMarkers.length }} markers?</v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="text-none"
            color="error"
            text
            @click="deleteSelection"
            :loading="deleteMarkersLoader"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { Component, Watch } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";
import DrawerMixin from "@/mixins/drawer";
import { mixins } from "vue-class-component";
import { contextModule } from "@/store/context";
import ILabel from "@/types/label";
import MarkerCard from "@/components/Cards/Marker.vue";
import actorFragment from "@/fragments/actor";
import { SearchStateManager, isQueryDifferent } from "../util/searchState";
import { Route } from "vue-router";
import { Dictionary } from "vue-router/types/router";
import { IMarker } from "@/types/marker";

@Component({
  components: { MarkerCard },
})
export default class MarkerList extends mixins(DrawerMixin) {
  get showSidenav() {
    return contextModule.showSidenav;
  }

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  markers = [] as any[];

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
      text: "Added to collection",
      value: "addedOn",
    },
    {
      text: "Alphabetical",
      value: "rawName",
    },
    {
      text: "Rating",
      value: "rating",
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

  allLabels = [] as ILabel[];

  fetchError = false;
  fetchLoader = false;

  numResults = 0;
  numPages = 0;
  selectionMode = false;

  deleteMarkersLoader = false;

  searchStateManager = new SearchStateManager<{
    page: number;
    query: string;
    durationRange: number[];
    favoritesOnly: boolean;
    bookmarksOnly: boolean;
    ratingFilter: number;
    selectedLabels: { include: string[]; exclude: string[] };
    sortBy: string;
    sortDir: string;
  }>({
    localStorageNamer: (key: string) => `pm_marker${key[0].toUpperCase()}${key.substr(1)}`,
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
    },
  });

  jumpPage: string | null = null;

  get searchState() {
    return this.searchStateManager.state;
  }

  resetPagination() {
    this.searchStateManager.onValueChanged("page", 1);
    this.updateRoute(this.searchStateManager.toQuery(), false, () => {
      // If the query wasn't different, just reset the flag
      this.searchStateManager.refreshed = true;
    });
  }

  @Watch("$route")
  onRouteChange(to: Route, from: Route) {
    if (isQueryDifferent(to.query as Dictionary<string>, from.query as Dictionary<string>)) {
      // Only update the state and reload, if the query changed => filters changed
      this.searchStateManager.parseFromQuery(to.query as Dictionary<string>);
      this.loadPage();
      return;
    }
  }

  selectedMarkers = [] as string[];
  lastSelectionMarkerId: string | null = null;
  deleteSelectedMarkersDialog = false;

  isMarkerSelected(id: string) {
    return !!this.selectedMarkers.includes(id);
  }

  selectMarker(id: string, add: boolean) {
    this.lastSelectionMarkerId = id;
    if (add && !this.isMarkerSelected(id)) {
      this.selectedMarkers.push(id);
    } else {
      this.selectedMarkers = this.selectedMarkers.filter((i) => i != id);
    }
  }

  toggleSelectionMode() {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) {
      this.selectedMarkers = [];
    }
  }

  @Watch("selectedMarkers")
  onSelectedMarkersChange(nextVal: string[]) {
    if (nextVal.length) {
      this.selectionMode = true;
    } else {
      this.selectionMode = false;
    }
  }

  /**
   * @param marker - the clicked marker
   * @param index - the index of the marker in the array
   * @param event - the mouse click event
   * @param forceSelectionChange - whether to force a selection change, instead of opening the scene
   * at the marker time
   */
  onMarkerClick(marker: IMarker, index: number, event: MouseEvent, forceSelectionChange = true) {
    let lastSelectionMarkerIndex =
      this.lastSelectionMarkerId !== null
        ? this.markers.findIndex((im) => im._id === this.lastSelectionMarkerId)
        : index;
    lastSelectionMarkerIndex = lastSelectionMarkerIndex === -1 ? index : lastSelectionMarkerIndex;

    if (event.shiftKey) {
      // Next state is opposite of the clicked scene state
      const nextSelectionState = !this.isMarkerSelected(marker._id);

      // Use >= to include the currently clicked scene, so it can be toggled
      // if necessary
      if (index >= lastSelectionMarkerIndex) {
        for (let i = lastSelectionMarkerIndex + 1; i <= index; i++) {
          this.selectMarker(this.markers[i]._id, nextSelectionState);
        }
      } else if (index < lastSelectionMarkerIndex) {
        for (let i = lastSelectionMarkerIndex; i >= index; i--) {
          this.selectMarker(this.markers[i]._id, nextSelectionState);
        }
      }
    } else if (forceSelectionChange || event.ctrlKey) {
      this.selectMarker(marker._id, !this.isMarkerSelected(marker._id));
    } else if (!forceSelectionChange) {
      this.$router.push(`/scene/${marker.scene._id}?t=${marker.time}&mk_name=${marker.name}`);
    }
  }

  async deleteSelection() {
    this.deleteMarkersLoader = true;

    try {
      await ApolloClient.mutate({
        mutation: gql`
          mutation($ids: [String!]!) {
            removeMarkers(ids: $ids)
          }
        `,
        variables: {
          ids: this.selectedMarkers,
        },
      });

      this.numResults = Math.max(0, this.numResults - this.selectedMarkers.length);
      this.markers = this.markers.filter((act) => !this.selectedMarkers.includes(act._id));
      this.selectedMarkers = [];
      this.deleteSelectedMarkersDialog = false;
    } catch (err) {
      console.error(err);
    }

    this.deleteMarkersLoader = false;
  }

  get fetchQuery() {
    return {
      query: this.searchState.query || "",
      include: this.searchState.selectedLabels.include,
      exclude: this.searchState.selectedLabels.exclude,
      favorite: this.searchState.favoritesOnly,
      bookmark: this.searchState.bookmarksOnly,
      rating: this.searchState.ratingFilter,
    };
  }

  async fetchPage(page: number, take = 24, random?: boolean, seed?: string) {
    const result = await ApolloClient.query({
      query: gql`
        query($query: MarkerSearchQuery!, $seed: String) {
          getMarkers(query: $query, seed: $seed) {
            items {
              _id
              name
              time
              favorite
              bookmark
              rating
              scene {
                name
                _id
              }
              actors {
                ...ActorFragment
              }
              thumbnail {
                _id
              }
              labels {
                _id
                name
                color
              }
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
          sortDir: this.searchState.sortDir,
          sortBy: random ? "$shuffle" : this.searchState.sortBy,
        },
        seed: seed || localStorage.getItem("pm_seed") || "default",
      },
    });

    return result.data.getMarkers;
  }

  refreshPage() {
    this.loadPage();
  }

  loadPage() {
    this.fetchLoader = true;

    return this.fetchPage(this.searchState.page)
      .then((result) => {
        this.searchStateManager.refreshed = true;
        this.fetchError = false;
        this.numResults = result.numItems;
        this.numPages = result.numPages;
        this.markers = result.items;
      })
      .catch((err) => {
        console.error(err);
        this.fetchError = true;
      })
      .finally(() => {
        this.fetchLoader = false;
      });
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
        name: "markers",
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

  beforeMount() {
    this.searchStateManager.initState(this.$route.query as Dictionary<string>);
    this.updateRoute(this.searchStateManager.toQuery(), true, this.loadPage);

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

<style scoped></style>
