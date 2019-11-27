import gql from "graphql-tag";

export default gql`
  fragment ImageFragment on Image {
    _id
    name
    labels {
      _id
      name
    }
    studio {
      _id
      name
    }
    bookmark
    favorite
    rating
  }
`;
