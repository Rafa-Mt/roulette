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
        const data = JSON.parse(sessionData);
        return {
          userId: data.user_id,
          username: data.username,
        };
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
  async removeBet(userId: number): Promise<void> {
    const bets = await this.getBets();
    const updatedBets = bets.filter((bet) => bet.userId !== userId);
    await this.client.del(BETS_KEY);
    for (const bet of updatedBets) {
      await this.addBet(bet);
    }
  }

  async getBets(): Promise<UserBet[]> {
    const bets = await this.client.lRange(BETS_KEY, 0, -1);
    return bets.map((b) => JSON.parse(b));
  }

  async clearBets(): Promise<void> {
    await this.client.del(BETS_KEY);
  }

  async saveUserConnection(userId: number, socketId: string): Promise<void> {
    await this.client.set(`user:${userId}:socket`, socketId);
  }

  async getUserConnection(userId: number): Promise<string | null> {
    return await this.client.get(`user:${userId}:socket`);
  }

  async removeUserConnection(userId: number): Promise<void> {
    await this.client.del(`user:${userId}:socket`);
  }

  async removeAllUserConnections(): Promise<void> {
    const keys = await this.client.keys("user:*:socket");
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

export default new RedisService();
