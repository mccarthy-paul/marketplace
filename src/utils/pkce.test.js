import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the crypto API
global.crypto = {
  getRandomValues: vi.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    digest: vi.fn(async (algorithm, data) => {
      // Mock SHA-256 digest - return a fixed buffer for testing
      return new ArrayBuffer(32);
    }),
  },
};

describe('PKCE Utils', () => {
  let pkceUtils;

  beforeEach(async () => {
    // Reset modules to ensure clean import
    vi.resetModules();
    // Dynamically import to get fresh module
    pkceUtils = await import('../pkce.js');
  });

  describe('generateRandomString', () => {
    it('generates a string of the specified length', () => {
      const length = 43;
      const result = pkceUtils.generateRandomString(length);
      expect(result).toHaveLength(length);
    });

    it('generates URL-safe characters only', () => {
      const result = pkceUtils.generateRandomString(100);
      const urlSafeRegex = /^[A-Za-z0-9\-_]+$/;
      expect(result).toMatch(urlSafeRegex);
    });

    it('generates different strings on subsequent calls', () => {
      const result1 = pkceUtils.generateRandomString(43);
      const result2 = pkceUtils.generateRandomString(43);
      expect(result1).not.toBe(result2);
    });
  });

  describe('base64URLEncode', () => {
    it('encodes a buffer to base64url format', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = pkceUtils.base64URLEncode(buffer);
      
      // Check that it doesn't contain standard base64 characters
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('replaces base64 characters with URL-safe equivalents', () => {
      // Create a buffer that would normally produce +, /, and = in base64
      const buffer = new Uint8Array([255, 255, 255]);
      const result = pkceUtils.base64URLEncode(buffer);
      
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });
  });

  describe('sha256', () => {
    it('returns a hashed value as an ArrayBuffer', async () => {
      const input = 'test-string';
      const result = await pkceUtils.sha256(input);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(crypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
    });

    it('encodes the input string before hashing', async () => {
      const input = 'test-verifier';
      await pkceUtils.sha256(input);
      
      // Check that TextEncoder was used (implicitly through the call)
      expect(crypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });
  });

  describe('generatePKCEPair', () => {
    it('generates a code verifier of length 43', async () => {
      const { codeVerifier } = await pkceUtils.generatePKCEPair();
      expect(codeVerifier).toHaveLength(43);
    });

    it('generates a valid code challenge', async () => {
      const { codeChallenge } = await pkceUtils.generatePKCEPair();
      
      // Code challenge should be base64url encoded
      const base64urlRegex = /^[A-Za-z0-9\-_]+$/;
      expect(codeChallenge).toMatch(base64urlRegex);
    });

    it('generates matching verifier and challenge pair', async () => {
      const { codeVerifier, codeChallenge } = await pkceUtils.generatePKCEPair();
      
      // Verify that both are strings
      expect(typeof codeVerifier).toBe('string');
      expect(typeof codeChallenge).toBe('string');
      
      // Verify they are not the same (challenge is hashed)
      expect(codeVerifier).not.toBe(codeChallenge);
    });

    it('generates different pairs on subsequent calls', async () => {
      const pair1 = await pkceUtils.generatePKCEPair();
      const pair2 = await pkceUtils.generatePKCEPair();
      
      expect(pair1.codeVerifier).not.toBe(pair2.codeVerifier);
      expect(pair1.codeChallenge).not.toBe(pair2.codeChallenge);
    });
  });
});