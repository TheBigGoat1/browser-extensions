// Binance Execution Pro - Security Vault
// Military-Grade AES-256-GCM Encryption with PBKDF2 Key Derivation

/**
 * Security Vault Module
 * 
 * This module provides:
 * - AES-256-GCM encryption for API keys
 * - PBKDF2 key derivation (1 million iterations)
 * - Secure storage management
 * - Master password handling
 * 
 * Security Features:
 * - Unique IV (Initialization Vector) per encryption
 * - Salt per user/profile
 * - Master password never stored
 * - Keys only decrypted in memory during session
 */

// Constants
const PBKDF2_ITERATIONS = 1000000; // 1 million iterations
const PBKDF2_HASH = 'SHA-256';
const KEY_LENGTH = 256; // 256 bits for AES-256
const IV_LENGTH = 12; // 12 bytes for GCM
const SALT_LENGTH = 16; // 16 bytes salt

// Storage keys
const STORAGE_KEYS = {
  VAULT_CONFIG: 'binance_vault_config',
  ENCRYPTED_PROFILES: 'binance_encrypted_profiles',
  VAULT_INITIALIZED: 'binance_vault_initialized'
};

/**
 * Derive encryption key from master password using PBKDF2
 * @param {string} password - Master password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
async function deriveKey(password, salt) {
  try {
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: PBKDF2_HASH
      },
      keyMaterial,
      { name: 'AES-GCM', length: KEY_LENGTH },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    console.error('[Security] Key derivation error:', error);
    throw new Error('Failed to derive encryption key');
  }
}

/**
 * Generate random bytes
 * @param {number} length - Number of bytes to generate
 * @returns {Uint8Array} Random bytes
 */
function generateRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Encrypt API credentials using AES-256-GCM
 * @param {string} apiKey - API Key (public, can be stored less securely)
 * @param {string} apiSecret - API Secret (must be encrypted)
 * @param {string} masterPassword - Master password for encryption
 * @param {string} profileName - Profile name for identification
 * @returns {Promise<Object>} Encrypted data with IV and salt
 */
async function encryptCredentials(apiKey, apiSecret, masterPassword, profileName) {
  try {
    // Generate unique salt for this profile
    const salt = generateRandomBytes(SALT_LENGTH);
    
    // Generate unique IV for this encryption
    const iv = generateRandomBytes(IV_LENGTH);
    
    // Derive encryption key from master password
    const encryptionKey = await deriveKey(masterPassword, salt);
    
    // Prepare data to encrypt (API Secret only - API Key is public)
    const dataToEncrypt = new TextEncoder().encode(apiSecret);
    
    // Encrypt using AES-256-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      encryptionKey,
      dataToEncrypt
    );
    
    // Convert encrypted data to base64 for storage
    const encryptedBase64 = arrayBufferToBase64(encryptedData);
    const ivBase64 = arrayBufferToBase64(iv);
    const saltBase64 = arrayBufferToBase64(salt);
    
    return {
      profileName: profileName,
      apiKey: apiKey, // Stored as-is (public)
      encryptedSecret: encryptedBase64,
      iv: ivBase64,
      salt: saltBase64,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('[Security] Encryption error:', error);
    throw new Error('Failed to encrypt credentials');
  }
}

/**
 * Decrypt API credentials
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} masterPassword - Master password
 * @returns {Promise<string>} Decrypted API Secret
 */
async function decryptCredentials(encryptedData, masterPassword) {
  try {
    // Convert base64 back to ArrayBuffer
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const encryptedSecret = base64ToArrayBuffer(encryptedData.encryptedSecret);
    
    // Derive the same encryption key
    const encryptionKey = await deriveKey(masterPassword, salt);
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      encryptionKey,
      encryptedSecret
    );
    
    // Convert back to string
    const apiSecret = new TextDecoder().decode(decryptedData);
    
    return apiSecret;
  } catch (error) {
    console.error('[Security] Decryption error:', error);
    throw new Error('Failed to decrypt credentials. Wrong password?');
  }
}

/**
 * Initialize security vault
 * @param {string} masterPassword - Master password
 * @returns {Promise<boolean>} Success status
 */
async function initializeVault(masterPassword) {
  try {
    // Validate password strength
    if (!validatePasswordStrength(masterPassword)) {
      throw new Error('Password does not meet strength requirements');
    }
    
    // Store vault initialization status (password hash for verification)
    const passwordHash = await hashPassword(masterPassword);
    
    await chrome.storage.local.set({
      [STORAGE_KEYS.VAULT_INITIALIZED]: true,
      [STORAGE_KEYS.VAULT_CONFIG]: {
        initialized: true,
        passwordHash: passwordHash,
        createdAt: Date.now()
      },
      [STORAGE_KEYS.ENCRYPTED_PROFILES]: []
    });
    
    return true;
  } catch (error) {
    console.error('[Security] Vault initialization error:', error);
    throw error;
  }
}

/**
 * Check if vault is initialized
 * @returns {Promise<boolean>} Initialization status
 */
async function isVaultInitialized() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.VAULT_INITIALIZED]);
    return result[STORAGE_KEYS.VAULT_INITIALIZED] === true;
  } catch (error) {
    console.error('[Security] Vault check error:', error);
    return false;
  }
}

/**
 * Verify master password
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} Verification result
 */
async function verifyMasterPassword(password) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.VAULT_CONFIG]);
    const config = result[STORAGE_KEYS.VAULT_CONFIG];
    
    if (!config || !config.passwordHash) {
      return false;
    }
    
    const passwordHash = await hashPassword(password);
    return passwordHash === config.passwordHash;
  } catch (error) {
    console.error('[Security] Password verification error:', error);
    return false;
  }
}

/**
 * Hash password for verification (SHA-256)
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Hashed password (base64)
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} Validation result
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return false;
  }
  
  // Check for uppercase, lowercase, number, special character
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  // Require at least 3 of 4 criteria
  const criteriaMet = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  return criteriaMet >= 3 || password.length >= 12;
}

/**
 * Save encrypted profile
 * @param {Object} profileData - Profile data (name, environment, apiKey, apiSecret)
 * @param {string} masterPassword - Master password
 * @returns {Promise<Object>} Saved profile with ID
 */
async function saveProfile(profileData, masterPassword) {
  try {
    // Verify master password
    const isValid = await verifyMasterPassword(masterPassword);
    if (!isValid) {
      throw new Error('Invalid master password');
    }
    
    // Encrypt credentials
    const encrypted = await encryptCredentials(
      profileData.apiKey,
      profileData.apiSecret,
      masterPassword,
      profileData.name
    );
    
    // Get existing profiles
    const result = await chrome.storage.local.get([STORAGE_KEYS.ENCRYPTED_PROFILES]);
    const profiles = result[STORAGE_KEYS.ENCRYPTED_PROFILES] || [];
    
    // Create profile object
    const profile = {
      id: Date.now().toString(),
      name: profileData.name,
      environment: profileData.environment || 'testnet',
      ...encrypted,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Check if profile with same name exists (update) or add new
    const existingIndex = profiles.findIndex(p => p.name === profileData.name);
    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profiles[existingIndex], ...profile, updatedAt: Date.now() };
    } else {
      profiles.push(profile);
    }
    
    // Save to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.ENCRYPTED_PROFILES]: profiles
    });
    
    return profile;
  } catch (error) {
    console.error('[Security] Save profile error:', error);
    throw error;
  }
}

/**
 * Get all profiles (without decrypting secrets)
 * @returns {Promise<Array>} List of profiles
 */
async function getProfiles() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.ENCRYPTED_PROFILES]);
    const profiles = result[STORAGE_KEYS.ENCRYPTED_PROFILES] || [];
    
    // Return profiles without sensitive data
    return profiles.map(p => ({
      id: p.id,
      name: p.name,
      environment: p.environment,
      apiKey: p.apiKey, // Public key is safe
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  } catch (error) {
    console.error('[Security] Get profiles error:', error);
    return [];
  }
}

/**
 * Get decrypted credentials for a profile
 * @param {string} profileId - Profile ID
 * @param {string} masterPassword - Master password
 * @returns {Promise<Object>} Decrypted credentials {apiKey, apiSecret}
 */
async function getDecryptedCredentials(profileId, masterPassword) {
  try {
    // Verify master password
    const isValid = await verifyMasterPassword(masterPassword);
    if (!isValid) {
      throw new Error('Invalid master password');
    }
    
    // Get profiles
    const result = await chrome.storage.local.get([STORAGE_KEYS.ENCRYPTED_PROFILES]);
    const profiles = result[STORAGE_KEYS.ENCRYPTED_PROFILES] || [];
    
    // Find profile
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // Decrypt API Secret
    const apiSecret = await decryptCredentials(profile, masterPassword);
    
    return {
      apiKey: profile.apiKey,
      apiSecret: apiSecret,
      environment: profile.environment,
      name: profile.name
    };
  } catch (error) {
    console.error('[Security] Get credentials error:', error);
    throw error;
  }
}

/**
 * Delete a profile
 * @param {string} profileId - Profile ID to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteProfile(profileId) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.ENCRYPTED_PROFILES]);
    const profiles = result[STORAGE_KEYS.ENCRYPTED_PROFILES] || [];
    
    const filtered = profiles.filter(p => p.id !== profileId);
    
    await chrome.storage.local.set({
      [STORAGE_KEYS.ENCRYPTED_PROFILES]: filtered
    });
    
    return true;
  } catch (error) {
    console.error('[Security] Delete profile error:', error);
    throw error;
  }
}

/**
 * Set active profile
 * @param {string} profileId - Profile ID to activate
 * @returns {Promise<boolean>} Success status
 */
async function setActiveProfile(profileId) {
  try {
    await chrome.storage.local.set({
      'binance_active_profile_id': profileId
    });
    return true;
  } catch (error) {
    console.error('[Security] Set active profile error:', error);
    throw error;
  }
}

/**
 * Get active profile ID
 * @returns {Promise<string|null>} Active profile ID
 */
async function getActiveProfileId() {
  try {
    const result = await chrome.storage.local.get(['binance_active_profile_id']);
    return result.binance_active_profile_id || null;
  } catch (error) {
    console.error('[Security] Get active profile error:', error);
    return null;
  }
}

/**
 * Clear all encrypted data (reset vault)
 * @returns {Promise<boolean>} Success status
 */
async function clearVault() {
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.VAULT_CONFIG,
      STORAGE_KEYS.ENCRYPTED_PROFILES,
      STORAGE_KEYS.VAULT_INITIALIZED,
      'binance_active_profile_id'
    ]);
    return true;
  } catch (error) {
    console.error('[Security] Clear vault error:', error);
    throw error;
  }
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
  window.binanceSecurity = {
    initializeVault,
    isVaultInitialized,
    verifyMasterPassword,
    validatePasswordStrength,
    saveProfile,
    getProfiles,
    getDecryptedCredentials,
    deleteProfile,
    setActiveProfile,
    getActiveProfileId,
    clearVault,
    encryptCredentials,
    decryptCredentials
  };
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.binanceSecurity = {
    initializeVault,
    isVaultInitialized,
    verifyMasterPassword,
    validatePasswordStrength,
    saveProfile,
    getProfiles,
    getDecryptedCredentials,
    deleteProfile,
    setActiveProfile,
    getActiveProfileId,
    clearVault,
    encryptCredentials,
    decryptCredentials
  };
}
