import { db } from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  status: 'online' | 'offline' | 'away';
  is_verified: boolean;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  refresh_token: string;
  device_info?: object;
  ip_address?: string;
  expires_at: Date;
  created_at: Date;
}

export class UserModel {
  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const verificationToken = uuidv4();
    
    const query = `
      INSERT INTO users (email, username, password_hash, display_name, verification_token, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, username, display_name, status, is_verified, created_at, updated_at
    `;
    
    const values = [
      userData.email,
      userData.username,
      hashedPassword,
      userData.display_name || userData.username,
      verificationToken,
      false
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Find user by verification token
  static async findByVerificationToken(token: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE verification_token = $1';
    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  // Find user by reset token
  static async findByResetToken(token: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()';
    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  // Verify user email
  static async verifyEmail(token: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET is_verified = true, verification_token = NULL, updated_at = NOW()
      WHERE verification_token = $1
    `;
    const result = await db.query(query, [token]);
    return (result.rowCount ?? 0) > 0;
  }

  // Update password
  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `;
    const result = await db.query(query, [hashedPassword, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // Set password reset token
  static async setResetToken(email: string, token: string, expiresAt: Date): Promise<boolean> {
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
      WHERE email = $3
    `;
    const result = await db.query(query, [token, expiresAt, email]);
    return (result.rowCount ?? 0) > 0;
  }

  // Clear reset token
  static async clearResetToken(userId: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
      WHERE id = $1
    `;
    const result = await db.query(query, [userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // Update last login
  static async updateLastLogin(userId: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET last_login = NOW(), updated_at = NOW()
      WHERE id = $1
    `;
    const result = await db.query(query, [userId]);
    return (result.rowCount ?? 0) > 0;
  }

  // Validate password
  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Create user session
  static async createSession(userId: string, refreshToken: string, deviceInfo?: object, ipAddress?: string): Promise<UserSession> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const query = `
      INSERT INTO user_sessions (user_id, refresh_token, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [userId, refreshToken, deviceInfo || null, ipAddress || null, expiresAt];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Find session by refresh token
  static async findSessionByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    const query = `
      SELECT * FROM user_sessions 
      WHERE refresh_token = $1 AND expires_at > NOW()
    `;
    const result = await db.query(query, [refreshToken]);
    return result.rows[0] || null;
  }

  // Delete session
  static async deleteSession(refreshToken: string): Promise<boolean> {
    const query = 'DELETE FROM user_sessions WHERE refresh_token = $1';
    const result = await db.query(query, [refreshToken]);
    return (result.rowCount ?? 0) > 0;
  }

  // Delete all user sessions (logout from all devices)
  static async deleteAllUserSessions(userId: string): Promise<boolean> {
    const query = 'DELETE FROM user_sessions WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return (result.rowCount ?? 0) > 0;
  }
}