import ApolloClient from "@/apollo";
import gql from "graphql-tag";

import { iterate, ProgressCallback } from "./iterate";

export type IterateScene = { _id: string };

export class Scene {
  static async iterate(
    itemCb: (item: IterateScene) => void | unknown | Promise<void> | Promise<unknown>,
    searchQuery?: Record<string, any>,
    progressCb?: ProgressCallback
  ): Promise<IterateScene | void> {
    return iterate<IterateScene>(
      (paginationQuery) =>
        ApolloClient.query({
          query: gql`
            query($query: SceneSearchQuery!) {
              getScenes(query: $query) {
                items {
                  _id
                }
                numItems
              }
            }
          `,
          variables: {
            query: {
              ...(searchQuery || {}),
              ...paginationQuery,
            },
          },
        }).then((res) => res.data.getScenes),
      itemCb,
      progressCb
    );
  }
}
