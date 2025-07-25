import Pool from 'pg-pool';
import { PoolConfig } from 'pg';
import { SpinResult } from '../types/socket';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
};
/**
 * CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    balance: NUMERIC(10, 2) DEFAULT 0.00
);

 */
const pool = new Pool(poolConfig);

export class DatabaseService {
  static async getUserBalance(userId: number): Promise<number | null> {
    try {
      const result = await pool.query(
        'SELECT balance FROM users WHERE user_id = $1',
        [userId]
      );
      if (result.rows.length > 0) {
        return parseFloat(result.rows[0].balance);
      }
      return null;
    } catch (error) {
      console.error('Error getting user balance:', error);
      throw error;
    }
  }

  static async updateUserBalance(userId: number, newBalance: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE users SET balance = $1 WHERE user_id = $2',
        [newBalance, userId]
      );
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  static async updateUserBalances(spinResult: SpinResult): Promise<void> {
    // use the updateUserBalance method to update each user's balance
    const updatePromises = spinResult.userBalances.map(async (userBalance) => {
      await this.updateUserBalance(userBalance.userId, userBalance.newBalance);
    });
    await Promise.all(updatePromises);
  }
}