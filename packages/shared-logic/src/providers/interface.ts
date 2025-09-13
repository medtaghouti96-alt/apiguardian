// File: packages/shared-logic/src/providers/interface.ts

/**
 * Defines the standardized data structure our proxy needs to make a request
 * to any AI provider.
 */
export interface ProviderRequestData {
  // The full, final URL for the provider's API endpoint
  url: string;
  // The headers required to call the provider's API (e.g., Authorization, Content-Type)
  headers: Record<string, string>;
  // The request body, already converted to a JSON string
  body: string;
}

/**
 * Defines the contract that every provider "adapter" must follow.
 * This ensures consistency and allows our core engine to be provider-agnostic.
 */
export interface ProviderAdapter {
  // A unique, lowercase identifier for the provider (e.g., "openai", "anthropic")
  id: string;

  /**
   * Transforms a generic request from our user into the specific format
   * required by the target AI provider.
   * @param decryptedApiKey The user's secret API key for the provider.
   * @param requestBody The raw JSON body from the original request.
   * @param slug The parts of the URL path from the original request.
   * @returns A ProviderRequestData object ready to be used in a `fetch` call.
   */
  transformRequest(
    decryptedApiKey: string,
    requestBody: any,
    slug: string[]
  ): ProviderRequestData;

  /**
   * Parses a successful response from the provider to extract the standardized
   * token usage and model information.
   * @param response The Response object from the `fetch` call.
   * @returns A promise that resolves to the standardized usage data.
   */
  parseResponse(response: Response): Promise<{
    model: string;
    promptTokens: number;
    completionTokens: number;
  }>;
}