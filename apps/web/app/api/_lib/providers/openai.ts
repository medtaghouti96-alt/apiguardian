// File: packages/shared-logic/src/providers/openai.ts

import { ProviderAdapter, ProviderRequestData } from './interface';

export const OpenAIAdapter: ProviderAdapter = {
  id: 'openai',

  transformRequest(decryptedApiKey: string, requestBody: any, slug: string[]): ProviderRequestData {
    // Reconstruct the original path the user was trying to call, e.g., "v1/chat/completions"
    const openaiPath = slug.join('/');
    const url = `https://api.openai.com/${openaiPath}`;
    
    return {
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${decryptedApiKey}`
      },
      body: JSON.stringify(requestBody)
    };
  },

  async parseResponse(response: Response) {
    // We need to handle the case where the response might be a stream.
    // For the MVP, we will start with the simpler, non-streaming case.
    // A full implementation would inspect the content-type.
    
    const responseData = await response.json();
    
    // Handle potential errors from OpenAI
    if (responseData.error) {
      console.error("Error from OpenAI API:", responseData.error.message);
      // Return zero usage on error to avoid incorrect billing
      return { model: responseData.model || 'unknown-error-model', promptTokens: 0, completionTokens: 0 };
    }

    return {
      model: responseData.model,
      promptTokens: responseData.usage?.prompt_tokens || 0,
      completionTokens: responseData.usage?.completion_tokens || 0
    };
  }
};