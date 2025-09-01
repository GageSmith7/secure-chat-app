import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// PostgreSQL connection
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
let redisClient: RedisClientType;

export const initializeRedis = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
  }
  
  return redisClient;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

// Database connection test
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Connected to PostgreSQL database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await db.end();
    if (redisClient) {
      await redisClient.quit();
    }
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};