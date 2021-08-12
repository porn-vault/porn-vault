import ApolloClient from "@/apollo";
import gql from "graphql-tag";

export async function attachLabelsToItem(itemId: string, labelIds: string[]): Promise<void> {
  await ApolloClient.mutate({
    mutation: gql`
      mutation($item: String!, $labels: [String!]!) {
        attachLabels(item: $item, labels: $labels)
      }
    `,
    variables: {
      item: itemId,
      labels: labelIds,
    },
  });
}

export async function detachLabelsFromItem(itemId: string, labelIds: string[]): Promise<void> {
  await ApolloClient.mutate({
    mutation: gql`
      mutation($item: String!, $labels: [String!]!) {
        detachLabels(item: $item, labels: $labels)
      }
    `,
    variables: {
      item: itemId,
      labels: labelIds,
    },
  });
}
