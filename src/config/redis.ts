import { createClient, RedisClientType } from "redis";

export class Redis {
  private static instance: Redis;

  private readonly redisUri: string;

  public client: RedisClientType;

  constructor(redisUri: string) {
    this.redisUri = redisUri;

    this.createClient();
  }

  private createClient() {
    try {
      this.client = createClient({
        url: this.redisUri,
      });
    } catch (error) {
      console.error(error);
    }
  }

  public async run() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error(error);
    }
  }

  public async stop() {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error(error);
    }
  }

  public static getInstance(): Redis {
    if (!Redis.instance) {
      Redis.instance = new Redis(process.env.REDIS_URI);
    }

    return Redis.instance;
  }
}

export const redis = Redis.getInstance();
