import { NhostClient } from "@nhost/react";

export const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "subdomain",
  region: process.env.NEXT_PUBLIC_NHOST_REGION || "region",
});
