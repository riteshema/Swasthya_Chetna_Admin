"use client";

import { type JSX, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({
  children,
}: Readonly<ProvidersProps>): JSX.Element {
  const query_client = new QueryClient();
  return (
    <QueryClientProvider client={query_client}>{children}</QueryClientProvider>
  );
}
