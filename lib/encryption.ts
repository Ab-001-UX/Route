import crypto from 'crypto';

const getKey = (): Buffer => {
  const hexKey = process.env.GPS_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('GPS_ENCRYPTION_KEY is not configured in environment variables');
  }
  if (hexKey.length !== 64) {
    throw new Error('GPS_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }
  return Buffer.from(hexKey, 'hex');
};

const IV_LENGTH = 12; // GCM standard IV length

/**
 * Encrypts cleartext using AES-256-GCM
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext formatted as iv_hex:auth_tag_hex:ciphertext_hex
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:authTag:ciphertext');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = Buffer.from(parts[2], 'hex');
  
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
