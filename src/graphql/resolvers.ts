import GraphQLLong from 'graphql-type-long';
import QueryResolvers from "./resolvers/query";
import ActorResolver from "./resolvers/actor";
import SceneResolver from "./resolvers/scene";
import MutationResolver from "./resolvers/mutation";

const resolvers = {
  Long: GraphQLLong,
  Actor: ActorResolver,
  Scene: SceneResolver,
  Query: QueryResolvers,
  Mutation: MutationResolver
}

export default resolvers;