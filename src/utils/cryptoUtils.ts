/**
 * Browser-native Cryptographic utilities using Web Crypto API (SubtleCrypto)
 * Provides AES-GCM-256 encryption/decryption for local backups & SHA-256 PIN hashing
 */

// Generate random salt hex string
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hash a PIN with salt using SHA-256
export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}:${salt}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verify a PIN against stored hash & salt
export async function verifyPin(pin: string, storedHash: string, salt: string): Promise<boolean> {
  const computedHash = await hashPin(pin, salt);
  return computedHash === storedHash;
}

// Derive AES-GCM Key from passphrase + salt using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data object or string to base64 encrypted payload
export async function encryptData(
  data: any,
  passphrase: string
): Promise<{ encryptedData: string; iv: string; salt: string }> {
  const enc = new TextEncoder();
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const plainBytes = enc.encode(jsonString);

  // Generate 16-byte salt and 12-byte IV for AES-GCM
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(salt);
  window.crypto.getRandomValues(iv);

  const key = await deriveKey(passphrase, salt);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plainBytes
  );

  // Convert to Base64
  const cipherBytes = new Uint8Array(cipherBuffer);
  let binary = '';
  for (let i = 0; i < cipherBytes.byteLength; i++) {
    binary += String.fromCharCode(cipherBytes[i]);
  }
  const encryptedBase64 = btoa(binary);

  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    encryptedData: encryptedBase64,
    iv: ivHex,
    salt: saltHex,
  };
}

// Decrypt base64 encrypted payload with passphrase
export async function decryptData(
  encryptedBase64: string,
  ivHex: string,
  saltHex: string,
  passphrase: string
): Promise<any> {
  // Parse salt and IV from hex
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  const iv = new Uint8Array(
    ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  // Parse cipherBytes from base64
  const binary = atob(encryptedBase64);
  const cipherBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    cipherBytes[i] = binary.charCodeAt(i);
  }

  const key = await deriveKey(passphrase, salt);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    cipherBytes
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);
  return JSON.parse(jsonString);
}
