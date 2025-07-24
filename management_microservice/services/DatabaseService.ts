import Pool from 'pg-pool';
import { PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
};

const pool = new Pool(poolConfig);

export class DatabaseService {
  static async getUserBalance(userId: number): Promise<number | null> {
    try {
      const result = await pool.query(
        'SELECT balance FROM balances WHERE user_id = $1',
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
}
