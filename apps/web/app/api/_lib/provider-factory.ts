// File: apps/web/app/api/_lib/provider-factory.ts

import { NextRequest } from 'next/server';
import { OpenAIAdapter } from './providers/openai';
import { ProviderAdapter } from './providers/interface';

/**
 * Determines which provider adapter to use based on the incoming request URL.
 * @param req - The NextRequest object.
 * @returns The appropriate ProviderAdapter or null if none is found.
 */
export function getProviderAdapter(req: NextRequest): ProviderAdapter | null {
  const url = new URL(req.url);
  const providerId = url.pathname.split('/api/proxy/')[1]?.split('/')[0];

  if (providerId === 'openai') {
    return OpenAIAdapter;
  }
  
  // Future: if (providerId === 'anthropic') { return AnthropicAdapter; }
  
  return null;
}