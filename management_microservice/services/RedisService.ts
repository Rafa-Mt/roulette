import { createClient, RedisClientType } from "redis";
import type { UserBet } from "../types/bet";

const BETS_KEY = "bets";

class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client.on("error", (err) => console.error("Redis Client Error", err));
    this.client.connect();
  }

  async getSessionInfo(
    token: string
  ): Promise<{ userId: number; username: string } | null> {
    try {
      const sessionData = await this.client.get(`session:${token}`);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (error) {
      console.error("Error getting session info from Redis:", error);
      throw error;
    }
  }

  async addBet(bet: UserBet): Promise<void> {
    await this.client.lPush(BETS_KEY, JSON.stringify(bet));
  }

  async getBets(): Promise<UserBet[]> {
    const bets = await this.client.lRange(BETS_KEY, 0, -1);
    return bets.map((b) => JSON.parse(b));
  }

  async clearBets(): Promise<void> {
    await this.client.del(BETS_KEY);
  }
}

export default new RedisService();
