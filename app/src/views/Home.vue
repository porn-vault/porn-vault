<template>
  <div>
    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Scenes</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numScenes }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Actors</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numActors }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Movies</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numMovies }}</span>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Images</v-card-title>
          <v-card-text>
            <span class="display-2">{{ numImages }}</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ApolloClient from "../apollo";
import gql from "graphql-tag";

@Component({
  components: {}
})
export default class Home extends Vue {
  numScenes = 0;
  numActors = 0;
  numMovies = 0;
  numImages = 0;

  beforeMount() {
    ApolloClient.query({
      query: gql`
        {
          numScenes
          numActors
          numMovies
          numImages
        }
      `
    })
      .then(res => {
        this.numScenes = res.data.numScenes;
        this.numActors = res.data.numActors;
        this.numMovies = res.data.numMovies;
        this.numImages = res.data.numImages;
      })
      .catch(err => {
        console.error(err);
      });
  }
}
</script>
