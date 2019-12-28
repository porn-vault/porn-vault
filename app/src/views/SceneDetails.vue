<template>
  <div>
    <div v-if="currentScene">

      <v-row>
        <v-col cols="2">
          <router-link v-if="currentScene.studio" :to="`/studio/${currentScene.studio._id}`">
              <v-img v-ripple max-width="200px" :src="studioLogo"></v-img>
          </router-link>

          <v-row v-if="actors.length">
            <v-col cols="12">
              <v-row>
                <v-col
                  class="pa-1"
                  v-for="(actor, i) in actors"
                  :key="actor._id"
                  cols="12"
                  sm="6"
                  md="6"
                  lg="6"
                >
                  <actor-card style="height: 100%" v-model="actors[i]" />
                </v-col>
              </v-row>
            </v-col>
          </v-row>

        </v-col>

        <v-col cols="7">
          <v-tabs
            grow
            background-color="primary"
            class="elevation-2"
            dark
            centered
          >

            <v-tab href="#video">
              Video
            </v-tab>

            <v-tab 
              href="#images"
              @click="loadImages"
            >
              Images
            </v-tab>

            <v-tab-item
              value="video"
            >
              <div class="mx-auto" id="dplayer" ref="dplayer"></div>
              <v-btn small color="primary" @click="openMarkerDialog">Create Marker</v-btn>
              <v-btn small color="primary" @click="openThumbnailDialog">Change Thumbnail</v-btn>

            </v-tab-item>

            <v-tab-item
              value="images"
            >

              <div class="d-flex align-center">
                <v-spacer></v-spacer>
                <h1 class="font-weight-light mr-3">{{ images.length }} Images</h1>
                <v-btn @click="openUploadDialog" icon>
                  <v-icon>mdi-upload</v-icon>
                </v-btn>
                <v-spacer></v-spacer>
              </div>
              <div v-if="images.length">
                <v-container fluid>
                  <v-row>
                    <v-col
                      class="pa-1"
                      v-for="(image, index) in images"
                      :key="image._id"
                      cols="6"
                      sm="4"
                      md="3"
                      lg="3"
                      xl="3"
                    >
                      <ImageCard @open="lightboxIndex = index" width="100%" height="100%" :image="image">
                        <template v-slot:action>
                          <v-tooltip top>
                            <template v-slot:activator="{ on }">
                              <v-btn
                                v-on="on"
                                @click.native.stop="setAsThumbnail(image._id)"
                                class="elevation-2 mb-2"
                                icon
                                style="background: #fafafa;"
                                light
                              >
                                <v-icon>mdi-image</v-icon>
                              </v-btn>
                            </template>
                            <span>Set as scene thumbnail</span>
                          </v-tooltip>
                        </template>
                      </ImageCard>
                    </v-col>
                  </v-row>

                  <transition name="fade">
                    <Lightbox
                      @delete="removeImage"
                      @update="updateImage"
                      :items="images"
                      :index="lightboxIndex"
                      @index="lightboxIndex = $event"
                    />
                  </transition>
                </v-container>
              </div>

            </v-tab-item>

          </v-tabs>

        </v-col>
        <v-col cols="3">
          <v-tabs
            fixed-tabs
            background-color="primary"
            class="elevation-2"
            dark
            centered
          >
            <v-tab href="#metadata">
              Metadata
            </v-tab>

            <v-tab href="#markers">
              Markers
            </v-tab>

            <v-tab href="#info">
              Info
            </v-tab>

              <v-tab-item
                value="metadata"
              >
              
                <v-card class="scene-info-card">
                  <v-form v-model="validEdit" class="mt-4">
                    <v-row>
                      <v-col cols="3">
                        <v-subheader>Scene Name:</v-subheader>
                      </v-col>
                    <v-col cols="9">
                      <v-text-field
                        flat
                        solo
                        :rules="sceneNameRules"
                        color="accent"
                        v-model="editName"
                        placeholder="Name"
                        hide-details
                      />
                    </v-col>

                    </v-row>

                    <DateInput v-if="editDialog" v-model="editReleaseDate" />

                    <v-row>
                      <v-col cols="3">
                        <v-subheader>Description:</v-subheader>
                      </v-col>
                      <v-col cols="9">
                        <v-textarea
                          solo 
                          flat
                          auto-grow
                          color="accent"
                          v-model="editDescription"
                          label="Description"
                          placeholder="Scene description"
                          :rows="2"
                          hide-details
                        />
                      </v-col>
                    </v-row>

                    <ActorSelector v-model="editActors" />

                    <StudioSelector v-model="editStudio" />

                    <v-row>
                      <v-col cols="3">
                        <v-subheader>Streaming Links:</v-subheader>
                      </v-col>
                      <v-col cols="9">
                        <v-textarea
                          solo 
                          flat
                          auto-grow
                          color="accent"
                          v-model="editStreamLinks"
                          label="Streaming Links"
                          placeholder="Streaming links (per line)"
                          :rows="2"
                          hide-details
                        />
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col cols="3">
                        <v-subheader>Labels:</v-subheader>
                      </v-col>
                      <v-col cols="9">
                        <div class="pa-2">
                          <v-chip
                            label
                            class="mr-1 mb-1"
                            small
                            outlined
                            v-for="label in labelNames"
                            :key="label"
                          >{{ label }}</v-chip>

                          <v-chip
                            label
                            color="accent"
                            v-ripple
                            @click="openLabelSelector"
                            small
                            :class="`mr-1 mb-1 hover ${$vuetify.theme.dark ? 'black--text' : 'white--text'}`"
                          >+ Add</v-chip>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col cols="3">
                        <v-subheader>Rating:</v-subheader>
                      </v-col>
                      <v-col cols="9">
                        <v-rating
                          half-increments
                          @input="rate"
                          class="px-2"
                          :value="currentScene.rating / 2"
                          background-color="grey"
                          color="amber"
                          dense
                          hide-details
                        ></v-rating>
                        <div
                          @click="rate(0)"
                          class="d-inline-block pl-3 mt-1 med--text caption hover"
                        >Reset rating</div>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col cols="3">
                        <v-subheader>Views:</v-subheader>
                      </v-col>
                      <v-col cols="9">
                        <div class="px-2 d-flex align-center">

                          {{ currentScene.watches.length }}
                          <v-btn
                            :class="`${$vuetify.theme.dark ? '' : 'black--text'}`"
                            fab
                            color="primary"
                            class="mx-3"
                            x-small
                            @click="watchScene"
                          >
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                          <v-btn
                            :disabled="!currentScene || !currentScene.watches.length"
                            :class="`${$vuetify.theme.dark ? '' : 'black--text'}`"
                            fab
                            color="primary"
                            x-small
                            @click="unwatchScene"
                          >
                            <v-icon>mdi-minus</v-icon>
                          </v-btn>
                        </div>
                      </v-col>
                    </v-row>

                  </v-form>
                </v-card>
              </v-tab-item>
            
              <v-tab-item
                value="markers"
              >

                <div>
                  <div class="mt-3">
                    <v-row>
                      <v-col cols="12" sm="8" md="6">
                        <MarkerItem
                          style="width: 100%"
                          @jump="moveToTime(marker.time, marker.name)"
                          @delete="removeMarker(marker._id)"
                          :marker="marker"
                          v-for="marker in markers"
                          :key="marker._id"
                        />
                      </v-col>
                    </v-row>
                  </div>
                 </div>

              </v-tab-item>

              <v-tab-item
                value="info"
              >


                <div v-if="currentScene.path" class="px-2 pt-2 d-flex align-center">
                  <v-subheader>Filesystem path</v-subheader>
                  {{ currentScene.path}}
                </div>
                <div v-if="currentScene.meta.dimensions.width" class="px-2 d-flex align-center">
                  <v-subheader>Video dimensions</v-subheader>
                  {{ currentScene.meta.dimensions.width }}x{{ currentScene.meta.dimensions.height }}
                </div>
                <div v-if="currentScene.meta.fps" class="px-2 d-flex align-center">
                  <v-subheader>Framerate</v-subheader>
                  {{ currentScene.meta.fps }} fps
                </div>
                <div v-if="currentScene.meta.size" class="px-2 d-flex align-center">
                  <v-subheader>Video size</v-subheader>
                  {{ (currentScene.meta.size / 1000 / 1000).toFixed(0) }} MB
                </div>

              </v-tab-item>


          </v-tabs>
        </v-col>
      </v-row>
      
      <v-row>
        <!-- <v-col cols="12" sm="4" md="4" lg="3" xl="2">
          <v-container>
            <v-hover>
              <template v-slot:default="{ hover }">
                <v-img
                  v-ripple
                  @click="openThumbnailDialog"
                  class="elevation-4 hover"
                  :aspect-ratio="aspectRatio"
                  cover
                  :src="thumbnail"
                >
                  <v-fade-transition>
                    <v-overlay v-if="hover" absolute color="accent">
                      <v-icon x-large>mdi-upload</v-icon>
                    </v-overlay>
                  </v-fade-transition>
                </v-img>
              </template>
            </v-hover>
          </v-container>
        </v-col>-->
        <v-col cols="12">



        </v-col>
      </v-row>

    </div>

    <v-dialog scrollable v-model="labelSelectorDialog" max-width="400px">
      <v-card :loading="labelEditLoader" v-if="currentScene">
        <v-card-title>Select labels for '{{ currentScene.name }}'</v-card-title>

        <v-card-text style="max-height: 400px">
          <LabelSelector :items="allLabels" v-model="selectedLabels" />
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="editLabels" text color="accent" class="text-none">Edit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-if="currentScene"
      :persistent="isUploading"
      scrollable
      v-model="uploadDialog"
      max-width="400px"
    >
      <ImageUploader
        :labels="currentScene.labels.map(l => l._id)"
        :name="currentScene.name"
        :actors="currentScene.actors.map(a => a._id)"
        :scene="currentScene._id"
        @update-state="isUploading = $event"
        @uploaded="images.unshift($event)"
      />
    </v-dialog>

    <v-dialog v-model="thumbnailDialog" max-width="600px">
      <v-card v-if="currentScene" :loading="thumbnailLoader">
        <v-card-title>Set thumbnail for '{{ currentScene.name }}'</v-card-title>
        <v-card-text>
          <v-file-input
            color="accent"
            placeholder="Select image"
            @change="readThumbnail"
            v-model="selectedThumbnail"
          ></v-file-input>
          <div v-if="thumbnailDisplay" class="text-center">
            <cropper
              style="height: 400px"
              class="cropper"
              :src="thumbnailDisplay"
              :stencilProps="{ aspectRatio: aspectRatio }"
              @change="changeCrop"
            ></cropper>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :disabled="!thumbnailDisplay"
            class="text-none"
            color="accent"
            text
            @click="uploadThumbnail"
          >Upload</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="markerDialog" max-width="400px">
      <v-card v-if="currentScene">
        <v-card-title>Create marker at {{ currentTimeFormatted() }}</v-card-title>
        <v-card-text>
          <v-text-field placeholder="Marker title" color="accent" v-model="markerName"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" text @click="createMarker" class="text-none">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import ApolloClient, { serverBase } from "../apollo";
import gql from "graphql-tag";
import sceneFragment from "../fragments/scene";
import studioFragment from "../fragments/studio";
import { sceneModule } from "../store/scene";
import actorFragment from "../fragments/actor";
import imageFragment from "../fragments/image";
import ActorCard from "../components/ActorCard.vue";
import moment from "moment";
import LabelSelector from "../components/LabelSelector.vue";
import Lightbox from "../components/Lightbox.vue";
import ImageCard from "../components/ImageCard.vue";
import InfiniteLoading from "vue-infinite-loading";
import { Cropper } from "vue-advanced-cropper";
import ImageUploader from "../components/ImageUploader.vue";
import { actorModule } from "../store/actor";
import IActor from "../types/actor";
import IImage from "../types/image";
import ILabel from "../types/label";
import { contextModule } from "../store/context";
import { watch, unwatch } from "../util/scene";
import MarkerItem from "../components/MarkerItem.vue";
import ActorSelector from "../components/ActorSelector.vue";
import StudioSelector from "../components/StudioSelector.vue";
import DateInput from "../components/DateInput.vue";

import "dplayer/dist/DPlayer.min.css";
import DPlayer from "dplayer";

interface ICropCoordinates {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ICropResult {
  coordinates: ICropCoordinates;
}

@Component({
  components: {
    ActorCard,
    LabelSelector,
    Lightbox,
    ImageCard,
    InfiniteLoading,
    Cropper,
    ImageUploader,
    MarkerItem,
    ActorSelector,
    StudioSelector,
    DateInput
  },
  beforeRouteLeave(_to, _from, next) {
    sceneModule.setCurrent(null);
    next();
  }
})
export default class SceneDetails extends Vue {
  actors = [] as IActor[];
  images = [] as IImage[];
  lightboxIndex = null as number | null;

  labelSelectorDialog = false;
  allLabels = [] as ILabel[];
  selectedLabels = [] as number[];
  labelEditLoader = false;

  infiniteId = 0;
  page = 0;

  thumbnailDialog = false;
  thumbnailLoader = false;
  thumbnailDisplay = null as string | null;
  selectedThumbnail = null as File | null;
  crop: ICropCoordinates = { left: 0, top: 0, width: 0, height: 0 };

  uploadDialog = false;
  isUploading = false;

  dp = null as any;

  markers = [] as { _id: string; name: string; time: number }[];
  markerName = "" as string | null;
  markerDialog = false;

  editDialog = false;
  validEdit = false;
  editName = "";
  editDescription = "";
  editStreamLinks = null as string | null;
  editActors = [] as IActor[];
  editStudio = null as any;
  editReleaseDate = null as number | null;

  sceneNameRules = [v => (!!v && !!v.length) || "Invalid scene name"];

  removeMarker(id: string) {
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!) {
          removeMarkers(ids: $ids)
        }
      `,
      variables: {
        ids: [id]
      }
    }).then(res => {
      this.markers = this.markers.filter(m => m._id != id);
    });
  }

  createMarker() {
    if (!this.currentScene) return;

    ApolloClient.mutate({
      mutation: gql`
        mutation($scene: String!, $name: String!, $time: Int!) {
          createMarker(scene: $scene, name: $name, time: $time) {
            _id
            name
            time
          }
        }
      `,
      variables: {
        scene: this.currentScene._id,
        name: this.markerName,
        time: this.currentTime()
      }
    }).then(res => {
      this.markers.unshift(res.data.createMarker);

      this.markers.sort((a, b) => a.time - b.time);
      this.markerName = "";
      this.markerDialog = false;
    });
  }

  formatTime(secs: number) {
    return moment()
      .startOf("day")
      .seconds(secs)
      .format("H:mm:ss");
  }

  currentTimeFormatted() {
    return this.formatTime(this.currentTime());
  }

  currentTime() {
    if (this.dp) return Math.round(this.dp.video.currentTime);
    return 0;
  }

  moveToTime(time: number, text?: string) {
    if (this.dp) {
      this.dp.seek(time);
      this.dp.play();
      if (text) this.dp.notice(text, 2000, 0.8);
    }
  }

  openMarkerDialog() {
    this.dp.pause();
    this.markerDialog = true;
  }

  async unwatchScene() {
    if (this.currentScene) await unwatch(this.currentScene);
  }

  async watchScene() {
    if (this.currentScene) await watch(this.currentScene);
  }

  get aspectRatio() {
    return contextModule.sceneAspectRatio;
  }

  get videoPath() {
    if (this.currentScene)
      return `${serverBase}/scene/${
        this.currentScene._id
      }?password=${localStorage.getItem("password")}`;
  }

  get dplayerOptions() {
    if (this.currentScene) {
      return {
        container: this.$refs.dplayer,
        autoplay: false,
        preload: true,
        video: {
          url: this.videoPath,
          poster: this.thumbnail,
          pic: this.thumbnail,
          type: "normal",
          thumbnails: this.currentScene.preview
            ? this.imageLink(this.currentScene.preview)
            : null
        },
        highlight: this.markers.map(m => ({
          text: m.name,
          time: m.time
        })),
        contextmenu: [
          {
            text: "Follow on GitHub",
            link: "https://github.com/boi123212321/porn-manager"
          }
        ]
      };
    }
  }

  @Watch("currentScene.actors", { deep: true })
  onActorChange(newVal: any[]) {
    this.actors = newVal;
  }

  openUploadDialog() {
    this.uploadDialog = true;
  }

  changeCrop(crop: ICropResult) {
    this.crop = {
      left: Math.round(crop.coordinates.left),
      top: Math.round(crop.coordinates.top),
      width: Math.round(crop.coordinates.width),
      height: Math.round(crop.coordinates.height)
    };
  }

  readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) resolve(reader.result.toString());
        else reject("File error");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async readThumbnail(file: File) {
    if (file) this.thumbnailDisplay = await this.readImage(file);
  }

  uploadThumbnail() {
    if (!this.currentScene) return;

    this.thumbnailLoader = true;

    ApolloClient.mutate({
      mutation: gql`
        mutation(
          $file: Upload!
          $name: String
          $crop: Crop
          $actors: [String!]
          $labels: [String!]
          $scene: String
        ) {
          uploadImage(
            file: $file
            name: $name
            crop: $crop
            actors: $actors
            labels: $labels
            scene: $scene
          ) {
            ...ImageFragment
            actors {
              ...ActorFragment
            }
            scene {
              _id
              name
            }
          }
        }
        ${imageFragment}
        ${actorFragment}
      `,
      variables: {
        file: this.selectedThumbnail,
        name: this.currentScene.name + " (thumbnail)",
        scene: this.currentScene._id,
        crop: {
          left: this.crop.left,
          top: this.crop.top,
          width: this.crop.width,
          height: this.crop.height
        },
        actors: this.currentScene.actors.map(a => a._id),
        labels: this.currentScene.labels.map(a => a._id)
      }
    })
      .then(res => {
        const image = res.data.uploadImage;
        this.images.unshift(image);
        this.setAsThumbnail(image._id);
        this.thumbnailDialog = false;
        this.thumbnailDisplay = null;
        this.selectedThumbnail = null;
      })
      .finally(() => {
        this.thumbnailLoader = false;
      });
  }

  openThumbnailDialog() {
    this.thumbnailDialog = true;
  }

  removeImage(index: number) {
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!) {
          removeImages(ids: $ids)
        }
      `,
      variables: {
        ids: [this.images[index]._id]
      }
    })
      .then(res => {
        this.images.splice(index, 1);
        this.lightboxIndex = null;
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {});
  }

  updateImage({
    index,
    key,
    value
  }: {
    index: number;
    key: string;
    value: any;
  }) {
    const images = this.images[index];
    images[key] = value;
    Vue.set(this.images, index, images);
  }

  get currentScene() {
    return sceneModule.current;
  }

  async fetchPage() {
    if (!this.currentScene) return;

    try {
      const query = `page:${this.page} sortDir:asc sortBy:addedOn scenes:${this.currentScene._id}`;

      const result = await ApolloClient.query({
        query: gql`
          query($query: String) {
            getImages(query: $query) {
              ...ImageFragment
              actors {
                ...ActorFragment
              }
              scene {
                _id
                name
              }
            }
          }
          ${imageFragment}
          ${actorFragment}
        `,
        variables: {
          query
        }
      });

      return result.data.getImages;
    } catch (err) {
      throw err;
    }
  }

  infiniteHandler($state) {
    this.fetchPage().then(items => {
      if (items.length) {
        this.page++;
        this.images.push(...items);
        $state.loaded();
      } else {
        $state.complete();
      }
    });
  }

  setAsThumbnail(id: string) {
    if (!this.currentScene) return;

    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!, $opts: SceneUpdateOpts!) {
          updateScenes(ids: $ids, opts: $opts) {
            thumbnail {
              _id
            }
          }
        }
      `,
      variables: {
        ids: [this.currentScene._id],
        opts: {
          thumbnail: id
        }
      }
    })
      .then(res => {
        sceneModule.setThumbnail(id);
      })
      .catch(err => {
        console.error(err);
      });
  }

  editLabels() {
    if (!this.currentScene) return;

    this.labelEditLoader = true;
    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!, $opts: SceneUpdateOpts!) {
          updateScenes(ids: $ids, opts: $opts) {
            labels {
              _id
              name
              aliases
            }
          }
        }
      `,
      variables: {
        ids: [this.currentScene._id],
        opts: {
          labels: this.selectedLabels
            .map(i => this.allLabels[i])
            .map(l => l._id)
        }
      }
    })
      .then(res => {
        sceneModule.setLabels(res.data.updateScenes[0].labels);
        this.labelSelectorDialog = false;
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        this.labelEditLoader = false;
      });
  }

  openLabelSelector() {
    if (!this.currentScene) return;

    if (!this.allLabels.length) {
      ApolloClient.query({
        query: gql`
          {
            getLabels {
              _id
              name
              aliases
            }
          }
        `
      })
        .then(res => {
          if (!this.currentScene) return;

          this.allLabels = res.data.getLabels;
          this.selectedLabels = this.currentScene.labels.map(l =>
            this.allLabels.findIndex(k => k._id == l._id)
          );
          this.labelSelectorDialog = true;
        })
        .catch(err => {
          console.error(err);
        });
    } else {
      this.labelSelectorDialog = true;
    }
  }

  get videoDuration() {
    if (this.currentScene)
      return this.formatTime(this.currentScene.meta.duration);
    return "";
  }

  imageLink(image: any) {
    return `${serverBase}/image/${image._id}?password=${localStorage.getItem(
      "password"
    )}`;
  }

  rate($event) {
    if (!this.currentScene) return;

    const rating = $event * 2;

    ApolloClient.mutate({
      mutation: gql`
        mutation($ids: [String!]!, $opts: SceneUpdateOpts!) {
          updateScenes(ids: $ids, opts: $opts) {
            rating
          }
        }
      `,
      variables: {
        ids: [this.currentScene._id],
        opts: {
          rating
        }
      }
    }).then(res => {
      sceneModule.setRating(rating);
    });
  }

  loadImages() {
      console.log("test");
      this.fetchPage().then(items => {
      if (items.length) {
        this.page++;
        this.images.push(...items);
        // More items exist
      } else {
        // This was the last page
      }
    });
  }

  get labelNames() {
    if (!this.currentScene) return [];
    return this.currentScene.labels.map(l => l.name).sort();
  }

  get thumbnail() {
    if (this.currentScene && this.currentScene.thumbnail)
      return `${serverBase}/image/${
        this.currentScene.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return "";
  }

  get studioLogo() {
    if (
      this.currentScene &&
      this.currentScene.studio &&
      this.currentScene.studio.thumbnail
    )
      return `${serverBase}/image/${
        this.currentScene.studio.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return "";
  }

  onLoad() {
    ApolloClient.query({
      query: gql`
        query($id: String!) {
          getSceneById(id: $id) {
            ...SceneFragment
            actors {
              ...ActorFragment
            }
            studio {
              ...StudioFragment
            }
            markers {
              _id
              name
              time
            }
          }
        }
        ${sceneFragment}
        ${actorFragment}
        ${studioFragment}
      `,
      variables: {
        id: (<any>this).$route.params.id
      }
    }).then(res => {
      sceneModule.setCurrent(res.data.getSceneById);
      this.actors = res.data.getSceneById.actors;
      this.markers = res.data.getSceneById.markers;
      this.markers.sort((a, b) => a.time - b.time);
      document.title = res.data.getSceneById.name;

      setTimeout(() => {
        this.dp = new DPlayer(this.dplayerOptions);
      }, 100);

      if (!this.currentScene) return;

      this.editName = this.currentScene.name;
      this.editDescription = this.currentScene.description || "";
      this.editStreamLinks = this.currentScene.streamLinks.join("\n");
      this.editActors = JSON.parse(JSON.stringify(this.currentScene.actors));
      this.editDialog = true;
      this.editStudio = this.currentScene.studio;
      this.editReleaseDate = this.currentScene.releaseDate;

    });
  }

  beforeMount() {
    this.onLoad();
  }

  mounted() {

    /* window.addEventListener("keydown", ev => {
          if (ev.keyCode >= 48 && ev.keyCode <= 53) {
            const rating = ev.keyCode - 48;
            this.rate(rating);
          } else if (ev.keyCode >= 96 && ev.keyCode <= 101) {
            const rating = ev.keyCode - 96;
            this.rate(rating);
          }
        }); */
  }
}
</script>

<style lang="scss" scoped>
  .corner-actions {
    position: absolute;
    top: 5px;
    right: 5px;
  }

  .scene-info-card {
    padding: 8px;
  }


</style>
