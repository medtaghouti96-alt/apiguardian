import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

// Define the cryptographic constants. Using AES-256-GCM is a modern,
// secure standard that includes authentication (it prevents tampering).
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Initialization Vector length
const SALT_LENGTH = 64; // Salt for key derivation
const TAG_LENGTH = 16; // GCM authentication tag length
const ENCODING = 'hex'; // We'll use hex encoding for easy string storage

/**
 * Encrypts a plaintext secret using the master key from the environment.
 *
 * This function is self-contained and uses the native Node.js crypto module.
 * It uses a salt to derive a unique key for each encryption, which is a security best practice.
 *
 * @param secret - The plaintext string to encrypt (e.g., "sk-xxxxxxxx").
 * @param masterKey - The master key from the environment (e.g., the one from `openssl rand -hex 32`).
 * @returns A single string containing all the necessary parts for decryption (salt, iv, tag, and encrypted data),
 *          separated by a colon ':'. This format is designed for easy storage in a single database TEXT column.
 */
export function encryptSecret(secret: string, masterKey: string): string {
  // 1. Generate a new, random salt for every encryption. This is crucial.
  const salt = randomBytes(SALT_LENGTH);

  // 2. Derive a secure 32-byte key from the master key and the salt.
  // `scryptSync` is a password-based key derivation function (PBKDF) that is
  // designed to be slow and memory-intensive to resist brute-force attacks.
  const key = scryptSync(masterKey, salt, 32);

  // 3. Generate a random Initialization Vector (IV).
  const iv = randomBytes(IV_LENGTH);

  // 4. Create the AES cipher instance.
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // 5. Encrypt the secret.
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);

  // 6. Get the authentication tag. This is a critical part of GCM mode that
  //    ensures the data has not been tampered with.
  const tag = cipher.getAuthTag();

  // 7. Combine all the parts into a single string for storage.
  //    The format is salt:iv:tag:encrypted_data
  return [
    salt.toString(ENCODING),
    iv.toString(ENCODING),
    tag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(':');
}

/**
 * Decrypts a stored secret string using the master key.
 *
 * @param encryptedSecret - The combined, colon-separated string from the database.
 * @param masterKey - The same master key used to encrypt the secret.
 * @returns The original plaintext string, or null if decryption fails for any reason
 *          (e.g., wrong key, tampered data).
 */
export function decryptSecret(
  encryptedSecret: string,
  masterKey: string
): string | null {
  try {
    // 1. Split the combined string back into its original parts.
    const [saltHex, ivHex, tagHex, encryptedHex] = encryptedSecret.split(':');

    // 2. Convert the hex-encoded parts back into binary Buffers.
    const salt = Buffer.from(saltHex, ENCODING);
    const iv = Buffer.from(ivHex, ENCODING);
    const tag = Buffer.from(tagHex, ENCODING);
    
    // 3. Re-derive the *exact same* encryption key using the stored salt.
    //    This is why storing the salt is essential.
    const key = scryptSync(masterKey, salt, 32);

    // 4. Create the AES decipher instance.
    const decipher = createDecipheriv(ALGORITHM, key, iv);

    // 5. Set the authentication tag. If the tag doesn't match, the decryption
    //    will fail, which protects against tampered data.
    decipher.setAuthTag(tag);

    // 6. Decrypt the data. This corrected line tells the decipher the format of the
    //    encrypted data ('hex') and the desired output format ('utf8').
    const decrypted = decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If any part of the process fails (e.g., bad format, wrong key, tampered tag),
    // an error will be thrown. We catch it and return null for safety.
    console.error(
      'Decryption failed. This may be due to a wrong master key or tampered data.',
      error
    );
    return null;
  }
}