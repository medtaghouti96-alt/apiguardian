// File: packages/shared-logic/src/auth.ts

import { createClient } from '@supabase/supabase-js';
import { decryptSecret } from './encryption';

/**
 * Lazily initializes and returns the Supabase admin client.
 * This prevents the client from being created at build time.
 * It will only be created at runtime when a request is made.
 */
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // This will now throw an error at RUNTIME if the variables are missing,
    // which is the correct behavior.
    throw new Error('Supabase environment variables are not configured on the server.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Authenticates an incoming API request to the proxy.
 * It validates the `ag-` key and decrypts the provider's secret key.
 * @param request - The incoming Request object.
 * @returns An object indicating success or failure, and containing project data
 *          and the decrypted key on success.
 */
export async function authenticateRequest(request: Request) {
  // Initialize the client here, inside the function, for every request.
  const supabase = getSupabaseAdmin();

  // 1. Get the ag- key from the Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ag-')) {
    return {
      isValid: false,
      status: 401,
      errorMessage: "Missing or invalid APIGuardian API Key.",
    };
  }
  const agKey = authHeader.split(' ')[1];

  // 2. Fetch the corresponding project from the database
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, openai_api_key_encrypted, monthly_budget')
    .eq('apiguardian_api_key', agKey)
    .single();

  if (projectError || !project) {
    return {
      isValid: false,
      status: 401,
      errorMessage: "APIGuardian API Key not found.",
    };
  }
  
  if (!project.openai_api_key_encrypted) {
      return {
          isValid: false,
          status: 401,
          errorMessage: "Provider API Key is not configured for this project.",
      }
  }

  // 3. Get the master key from the environment
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    console.error("CRITICAL: ENCRYPTION_KEY is not set on the server.");
    return {
      isValid: false,
      status: 500,
      errorMessage: "Internal Server Configuration Error",
    };
  }

  // 4. Decrypt the secret key
  const decryptedKey = decryptSecret(
    project.openai_api_key_encrypted,
    masterKey
  );

  if (!decryptedKey) {
    console.error(`CRITICAL: Failed to decrypt secret for project: ${project.id}. Master key may be wrong.`);
    return {
      isValid: false,
      status: 500,
      errorMessage: "Internal Security Error",
    };
  }

  // 5. Success! Return the validated data.
  return {
    isValid: true,
    status: 200,
    project: {
        id: project.id,
        user_id: project.user_id,
        monthly_budget: project.monthly_budget
    },
    decryptedKey: decryptedKey,
  };
}