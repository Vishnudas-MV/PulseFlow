import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Generates an HMAC SHA-256 signature for a payload.
   */
  public static generateHmacSha256(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verifies an HMAC signature using constant-time comparison to prevent timing attacks.
   */
  public static verifyHmacSha256(payload: string, secret: string, signature: string): boolean {
    const expected = this.generateHmacSha256(payload, secret);
    const expectedBuffer = Buffer.from(expected, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }

  /**
   * Generates a cryptographically secure random token (hex string).
   */
  public static generateSecureToken(byteLength = 32): string {
    return crypto.randomBytes(byteLength).toString('hex');
  }
}
