import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://backend-YOUR_SUBDOMAIN.YOUR_REGION.nhost.run/v1/graphql", // Replace with your Hasura GraphQL endpoint
  cache: new InMemoryCache(),
  // Optionally, add headers for authentication if needed
});

export default client;
