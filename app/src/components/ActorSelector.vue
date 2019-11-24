<template>
  <div>
    <v-autocomplete
      color="accent"
      v-model="innerValue"
      :loading="loading"
      :items="actors"
      :search-input.sync="searchQuery"
      cache-items
      hide-no-data
      label="Search for actors"
      multiple
      item-text="name"
      item-value="_id"
      clearable
      @input="onInnerValueChange"
    >
      <template v-slot:item="{ item }">
        <template>
          <v-list-item-avatar>
            <img :src="thumbnail(item)" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-html="item.name"></v-list-item-title>
          </v-list-item-content>
        </template>
      </template>
    </v-autocomplete>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ApolloClient, { serverBase } from "../apollo";
import gql from "graphql-tag";
import actorFragment from "../fragments/actor";
import IActor from "../types/actor";

@Component
export default class ActorSelector extends Vue {
  @Prop() value!: IActor[];

  innerValue = this.value || [];

  actors: IActor[] = this.value || [];
  searchQuery = "";

  loading = false;
  resetTimeout = null as NodeJS.Timeout | null;

  @Watch("value")
  onValueChange(newVal: IActor[]) {
    this.innerValue = newVal;
  }

  onInnerValueChange(newVal: string[]) {
    this.$emit("input", newVal
      .map(id => this.actors.find(a => a._id == id))
      .filter(Boolean) as IActor[]);
  }

  thumbnail(actor: IActor) {
    if (actor.thumbnail)
      return `${serverBase}/image/${
        actor.thumbnail._id
      }?password=${localStorage.getItem("password")}`;
    return "";
  }

  @Watch("searchQuery")
  onSearch(newVal: string | null) {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    if (!this.searchQuery) return;

    this.resetTimeout = setTimeout(() => {
      this.loading = true;
      this.fetchPage(this.searchQuery);
    }, 500);
  }

  async fetchPage(searchQuery: string) {
    try {
      const query = `query:'${searchQuery || ""}'`;

      const result = await ApolloClient.query({
        query: gql`
          query($query: String) {
            getActors(query: $query) {
              ...ActorFragment
            }
          }
          ${actorFragment}
        `,
        variables: {
          query
        }
      });

      this.loading = false;
      this.actors.push(...result.data.getActors);

      const ids = [...new Set(this.actors.map(a => a._id))];

      this.actors = ids
        .map(id => this.actors.find(a => a._id == id))
        .filter(Boolean) as IActor[];
    } catch (err) {
      throw err;
    }
  }
}
</script>

<style lang="scss" scoped>
</style>