import ApolloClient from "@/apollo";
import gql from "graphql-tag";

import { iterate, ProgressCallback } from "./iterate";

export type IterateStudio = { _id: string };

export class Studio {
  static async iterate(
    itemCb: (item: IterateStudio) => void | unknown | Promise<void> | Promise<unknown>,
    searchQuery?: Record<string, any>,
    progressCb?: ProgressCallback
  ): Promise<IterateStudio | void> {
    return iterate<IterateStudio>(
      (paginationQuery) =>
        ApolloClient.query({
          query: gql`
            query($query: StudioSearchQuery!) {
              getStudios(query: $query) {
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
        }).then((res) => res.data.getStudios),
      itemCb,
      progressCb
    );
  }
}
