<template>
  <v-container fluid>
    <BindFavicon />
    <BindTitle value="Studios" />

    <v-navigation-drawer v-if="showSidenav" style="z-index: 14" v-model="drawer" clipped app>
      <v-container>
        <v-btn
          :disabled="refreshed"
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
          v-model="query"
          label="Search query"
          class="mb-2"
        ></v-text-field>

        <div class="d-flex align-center">
          <v-btn
            :color="favoritesOnly ? 'red' : undefined"
            icon
            @click="favoritesOnly = !favoritesOnly"
          >
            <v-icon>{{ favoritesOnly ? "mdi-heart" : "mdi-heart-outline" }}</v-icon>
          </v-btn>

          <v-btn
            :color="bookmarksOnly ? 'primary' : undefined"
            icon
            @click="bookmarksOnly = !bookmarksOnly"
          >
            <v-icon>{{ bookmarksOnly ? "mdi-bookmark" : "mdi-bookmark-outline" }}</v-icon>
          </v-btn>

          <v-spacer></v-spacer>
        </div>

        <Divider icon="mdi-label">Labels</Divider>

        <LabelFilter
          @change="onSelectedLabelsChange"
          class="mt-0"
          v-model="selectedLabels"
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
          v-model="sortBy"
          placeholder="Sort by..."
          :items="sortByItems"
          class="mt-0 pt-0 mb-2"
        ></v-select>
        <v-select
          solo
          flat
          single-line
          :disabled="sortBy == 'relevance' || sortBy == '$shuffle'"
          hide-details
          color="primary"
          item-text="text"
          item-value="value"
          v-model="sortDir"
          placeholder="Sort direction"
          :items="sortDirItems"
        ></v-select>
      </v-container>
    </v-navigation-drawer>
    <v-alert class="mb-3" v-if="skippedStudiosWarning" dense text dismissible type="warning"
      >These studios already exist and were skipped: <b>{{ skippedStudiosWarning }}</b></v-alert
    >

    <div class="text-center" v-if="fetchError">
      <div>There was an error</div>
      <v-btn class="mt-2" @click="loadPage(page)">Try again</v-btn>
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
            <v-btn v-on="on" :disabled="sortBy != '$shuffle'" @click="rerollSeed" icon>
              <v-icon>mdi-dice-3-outline</v-icon>
            </v-btn>
          </template>
          <span>Reshuffle</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <div>
          <v-pagination
            v-if="!fetchLoader && $vuetify.breakpoint.mdAndUp"
            @input="loadPage"
            v-model="page"
            :total-visible="9"
            :disabled="fetchLoader"
            :length="numPages"
          ></v-pagination>
        </div>
      </div>
      <v-row v-if="!fetchLoader && numResults">
        <v-col
          class="pa-1"
          v-for="studio in studios"
          :key="studio._id"
          cols="6"
          sm="6"
          md="4"
          lg="3"
          xl="2"
        >
          <studio-card :showLabels="showCardLabels" :studio="studio" style="height: 100%" />
        </v-col>
      </v-row>
      <NoResults v-else-if="!fetchLoader && !numResults" />
      <Loading v-else />
    </div>
    <div class="mt-3" v-if="numResults && numPages > 1">
      <v-pagination
        @input="loadPage"
        v-model="page"
        :total-visible="9"
        :disabled="fetchLoader"
        :length="numPages"
      ></v-pagination>
      <div class="text-center mt-3">
        <v-text-field
          :disabled="fetchLoader"
          solo
          flat
          color="primary"
          v-model.number="page"
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
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import ApolloClient, { serverBase } from "@/apollo";
import gql from "graphql-tag";
import { contextModule } from "@/store/context";
import ILabel from "@/types/label";
import studioFragment from "@/fragments/studio";
import StudioCard from "@/components/Cards/Studio.vue";
import { mixins } from "vue-class-component";
import DrawerMixin from "@/mixins/drawer";
import { studioModule } from "@/store/studio";
import { checkStudioExist } from "../api/search";

@Component({
  components: {
    StudioCard,
  },
})
export default class StudioList extends mixins(DrawerMixin) {
  get showSidenav() {
    return contextModule.showSidenav;
  }

  rerollSeed() {
    const seed = Math.random().toString(36);
    localStorage.setItem("pm_seed", seed);
    if (this.sortBy === "$shuffle") this.loadPage(this.page);
    return seed;
  }

  studios = [] as any[];

  fetchLoader = false;
  fetchError = false;
  fetchingRandom = false;

  studiosBulkText = "" as string | null;
  skippedStudiosWarning = null as string | null;
  bulkImportDialog = false;
  bulkLoader = false;

  get showCardLabels() {
    return contextModule.showCardLabels;
  }

  async runBulkImport() {
    this.bulkLoader = true;

    let skippedStudios: string[] = [];
    this.skippedStudiosWarning = null;

    try {
      for (const name of this.studiosBulkImport) {
        if (await checkStudioExist(name)) {
          skippedStudios.push(name);
        } else {
          await this.createStudioWithName(name);
        }
      }
      this.refreshPage();
      this.bulkImportDialog = false;
    } catch (error) {
      console.error(error);
    }

    this.studiosBulkText = "";
    this.bulkLoader = false;

    // triggers warning alert if any studios were skipped because they already existed
    if (skippedStudios.length > 0) {
      this.skippedStudiosWarning = skippedStudios.join(", ");
    }
  }

  get studiosBulkImport() {
    if (this.studiosBulkText) return this.studiosBulkText.split("\n").filter(Boolean);
    return [];
  }

  tryReadLabelsFromLocalStorage(key: string) {
    return (localStorage.getItem(key) || "").split(",").filter(Boolean) as string[];
  }

  allLabels = [] as ILabel[];
  selectedLabels = {
    include: this.tryReadLabelsFromLocalStorage("pm_studioInclude"),
    exclude: this.tryReadLabelsFromLocalStorage("pm_studioExclude"),
  };

  onSelectedLabelsChange(val: any) {
    localStorage.setItem("pm_studioInclude", val.include.join(","));
    localStorage.setItem("pm_studioExclude", val.exclude.join(","));
    this.refreshed = false;
  }

  query = localStorage.getItem("pm_studioQuery") || "";

  set page(page: number) {
    const x = Number(page);
    if (isNaN(x) || x <= 0 || x > this.numPages) {
      studioModule.setPage(1);
    } else {
      studioModule.setPage(x || 1);
    }
  }

  get page() {
    return studioModule.page;
  }

  get numResults() {
    return studioModule.numResults;
  }

  get numPages() {
    return studioModule.numPages;
  }

  sortDir = localStorage.getItem("pm_studioSortDir") || "desc";
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

  sortBy = localStorage.getItem("pm_studioSortBy") || "relevance";
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

  favoritesOnly = localStorage.getItem("pm_studioFavorite") == "true";
  bookmarksOnly = localStorage.getItem("pm_studioBookmark") == "true";

  labelIDs(indices: number[]) {
    return indices.map((i) => this.allLabels[i]).map((l) => l._id);
  }

  labelNames(indices: number[]) {
    return indices.map((i) => this.allLabels[i].name);
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

  refreshed = true;

  resetPagination() {
    studioModule.resetPagination();
    this.refreshed = true;
    this.loadPage(this.page).catch(() => {
      this.refreshed = false;
    });
  }

  @Watch("ratingFilter", {})
  onRatingChange(newVal: number) {
    localStorage.setItem("pm_studioRating", newVal.toString());
    this.refreshed = false;
  }

  @Watch("favoritesOnly")
  onFavoriteChange(newVal: boolean) {
    localStorage.setItem("pm_studioFavorite", "" + newVal);
    this.refreshed = false;
  }

  @Watch("bookmarksOnly")
  onBookmarkChange(newVal: boolean) {
    localStorage.setItem("pm_studioBookmark", "" + newVal);
    this.refreshed = false;
  }

  @Watch("sortDir")
  onSortDirChange(newVal: string) {
    localStorage.setItem("pm_studioSortDir", newVal);
    this.refreshed = false;
  }

  @Watch("sortBy")
  onSortChange(newVal: string) {
    localStorage.setItem("pm_studioSortBy", newVal);
    this.refreshed = false;
  }

  @Watch("query")
  onQueryChange(newVal: string | null) {
    localStorage.setItem("pm_studioQuery", newVal || "");
    this.refreshed = false;
  }

  @Watch("selectedLabels")
  onLabelChange() {
    studioModule.resetPagination();
    this.loadPage(this.page);
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
          query: this.query || "",
          include: this.selectedLabels.include,
          exclude: this.selectedLabels.exclude,
          take,
          page: page - 1,
          sortDir: this.sortDir,
          sortBy: random ? "$shuffle" : this.sortBy,
          favorite: this.favoritesOnly,
          bookmark: this.bookmarksOnly,
        },
        seed: seed || localStorage.getItem("pm_seed") || "default",
      },
    });

    return result.data.getStudios;
  }

  loadPage(page: number) {
    this.fetchLoader = true;

    return this.fetchPage(page)
      .then((result) => {
        this.fetchError = false;
        studioModule.setPagination({
          numResults: result.numItems,
          numPages: result.numPages,
        });
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

  refreshPage() {
    this.loadPage(studioModule.page);
  }

  mounted() {
    if (!this.studios.length) this.refreshPage();
  }

  beforeMount() {
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
          this.selectedLabels.include = [];
          this.selectedLabels.exclude = [];
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
</script>