"use client";
import { NhostProvider } from "@nhost/react";
import { nhost } from "../lib/nhost";
import { ApolloProvider } from "@apollo/client";
import client from "../lib/apollo";

export default function ClientProvider({ children }) {
  return (
    <NhostProvider nhost={nhost}>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </NhostProvider>
  );
}
