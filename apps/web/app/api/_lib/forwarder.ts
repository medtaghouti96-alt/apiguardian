// File: apps/web/app/api/_lib/forwarder.ts

import { NextRequest } from 'next/server';
import { ProviderAdapter } from './providers/interface';

interface ForwardRequestParams {
  request: NextRequest;
  decryptedKey: string;
  adapter: ProviderAdapter;
}

/**
 * Forwards an incoming request to the appropriate AI provider using the provided adapter.
 * @param params - The necessary parameters for forwarding the request.
 * @returns The Response object from the upstream AI provider.
 */
export async function forwardRequestToProvider({
  request,
  decryptedKey,
  adapter,
}: ForwardRequestParams): Promise<Response> {
  // The [...slug] part of the URL is available in the request's pathname.
  // We need to extract the part that comes after `/api/proxy/`.
  const url = new URL(request.url);
  const slugParts = url.pathname.split('/api/proxy/')[1]?.split('/');
  
  if (!slugParts) {
      throw new Error("Could not parse provider path from URL.");
  }

  // We pass the slug parts after the provider ID (e.g., ["v1", "chat", "completions"])
  const slugWithoutProvider = slugParts.slice(1);
  
  // Get the provider-specific request data from the adapter
  const providerRequest = adapter.transformRequest(
    decryptedKey,
    await request.json(), // Read the JSON body from the original request
    slugWithoutProvider
  );

  // Make the fetch call to the actual AI provider
  return fetch(providerRequest.url, {
    method: 'POST',
    headers: providerRequest.headers,
    body: providerRequest.body,
  });
}