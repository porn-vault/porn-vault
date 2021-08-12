import ApolloClient from "@/apollo";
import gql from "graphql-tag";

import { iterate, ProgressCallback } from "./iterate";

export type IterateActor = { _id: string };

export class Actor {
  static async iterate(
    itemCb: (item: IterateActor) => void | unknown | Promise<void> | Promise<unknown>,
    searchQuery?: Record<string, any>,
    progressCb?: ProgressCallback
  ): Promise<IterateActor | void> {
    return iterate<IterateActor>(
      (paginationQuery) =>
        ApolloClient.query({
          query: gql`
            query($query: ActorSearchQuery!) {
              getActors(query: $query) {
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
        }).then((res) => res.data.getActors),
      itemCb,
      progressCb
    );
  }
}
