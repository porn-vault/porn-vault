import ApolloClient from "../apollo";
import gql from "graphql-tag";

export async function checkActorExist(name: string) {
  const result = await ApolloClient.query({
    query: gql`
      query($query: ActorSearchQuery!, $seed: String) {
        getActors(query: $query, seed: $seed) {
          items {
            name
          }
          numItems
        }
      }
    `,
    variables: {
      query: {
        query: name,
        sortBy: "relevance",
      },
      seed: localStorage.getItem("pm_seed") || "default",
    },
  });

  // Verify that the highest relevance ES result is an exact name match
  if (result.data.getActors.items.length > 0 && result.data.getActors.items[0].name === name) {
    return true;
  } else {
    return false;
  }
}

export async function checkMovieExist(name: string) {
  const result = await ApolloClient.query({
    query: gql`
      query($query: MovieSearchQuery!, $seed: String) {
        getMovies(query: $query, seed: $seed) {
          items {
            name
          }
          numItems
        }
      }
    `,
    variables: {
      query: {
        query: name,
        sortBy: "relevance",
      },
      seed: localStorage.getItem("pm_seed") || "default",
    },
  });

  // Verify that the highest relevance ES result is an exact name match
  if (result.data.getMovies.items.length > 0 && result.data.getMovies.items[0].name === name) {
    return true;
  } else {
    return false;
  }
}

export async function checkStudioExist(name: string) {
  const result = await ApolloClient.query({
    query: gql`
      query($query: StudioSearchQuery!, $seed: String) {
        getStudios(query: $query, seed: $seed) {
          items {
            name
          }
          numItems
        }
      }
    `,
    variables: {
      query: {
        query: name,
        sortBy: "relevance",
      },
      seed: localStorage.getItem("pm_seed") || "default",
    },
  });

  // Verify that the highest relevance ES result is an exact name match
  if (result.data.getStudios.items.length > 0 && result.data.getStudios.items[0].name === name) {
    return true;
  } else {
    return false;
  }
}
