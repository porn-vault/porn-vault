import ApolloClient from "@/apollo";
import gql from "graphql-tag";

import { iterate, ProgressCallback } from "./iterate";

export type IterateMovie = { _id: string };

export class Movie {
  static async iterate(
    itemCb: (item: IterateMovie) => void | unknown | Promise<void> | Promise<unknown>,
    searchQuery?: Record<string, any>,
    progressCb?: ProgressCallback
  ): Promise<IterateMovie | void> {
    return iterate<IterateMovie>(
      (paginationQuery) =>
        ApolloClient.query({
          query: gql`
            query($query: MovieSearchQuery!) {
              getMovies(query: $query) {
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
        }).then((res) => res.data.getMovies),
      itemCb,
      progressCb
    );
  }
}
