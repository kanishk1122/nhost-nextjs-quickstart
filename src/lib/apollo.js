import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://kcfsfsxsxxhilhvmnfjw.hasura.ap-south-1.nhost.run/v1/graphql", // Replace with your Hasura GraphQL endpoint
  cache: new InMemoryCache(),
  // Optionally, add headers for authentication if needed
  headers: {
    "x-hasura-admin-secret": process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET,
  },
});

export default client;
