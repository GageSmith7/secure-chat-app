import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  isVerified: boolean;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTUtils {
  private static getAccessTokenSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  }

  private static getRefreshTokenSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    return secret;
  }

  // Generate access token
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = this.getAccessTokenSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    
    return (jwt as any).sign(payload, secret, { expiresIn });
  }

  // Generate refresh token
  static generateRefreshToken(): string {
    const secret = this.getRefreshTokenSecret();
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    return (jwt as any).sign({ tokenId: uuidv4() }, secret, { expiresIn });
  }

  // Generate token pair
  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(),
    };
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const secret = this.getAccessTokenSecret();
      const decoded = (jwt as any).verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): any {
    try {
      const secret = this.getRefreshTokenSecret();
      return (jwt as any).verify(token, secret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Get token expiration time
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = (jwt as any).decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
    } catch (error) {
      // Token is malformed
    }
    return null;
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration.getTime() <= Date.now();
  }

  // Decode token without verification (for debugging)
  static decodeToken(token: string): any {
    try {
      return (jwt as any).decode(token);
    } catch (error) {
      return null;
    }
  }
}