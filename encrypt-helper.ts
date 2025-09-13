// File: encrypt-helper.ts
import 'dotenv/config'; // Loads variables from your .env file
import { encryptSecret } from './apps/web/app/api/_lib/encryption';

// --- Configuration ---
// This is the secret you want to encrypt.
// IMPORTANT: Replace this placeholder with your REAL OpenAI API key.
const SECRET_TO_ENCRYPT = "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";

// This is the master key used for encryption.
const masterKey = process.env.ENCRYPTION_KEY;

// --- The Script ---
function runEncryption() {
  console.log("--- APIGuardian Encryption Helper ---");

  if (!masterKey) {
    console.error("🔴 ERROR: ENCRYPTION_KEY is missing from your .env file.");
    return;
  }
  
  if (!SECRET_TO_ENCRYPT || SECRET_TO_ENCRYPT === "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
      console.error("🔴 ERROR: Please replace the placeholder in the SECRET_TO_ENCRYPT variable with your real OpenAI key.");
      return;
  }

  console.log("Encrypting your secret...");
  
  const encryptedString = encryptSecret(SECRET_TO_ENCRYPT, masterKey);

  console.log("\n✅  Encryption Successful!");
  console.log("\nCopy the entire line below and paste it into the 'openai_api_key_encrypted' column in Supabase:\n");
  
  // We add extra lines before and after to make it easy to copy the whole thing.
  console.log("------------------------------------------------------------------");
  console.log(encryptedString);
  console.log("------------------------------------------------------------------");
}

runEncryption();