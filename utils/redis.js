import { createClient } from 'redis';

const util = require('util');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isconnected = true;
    this.client.on('error', (err) => {
      this.isconnected = false;
      console.log('Redis client failed to connect:', err.message);
    });
    this.client.on('connect', () => {
      this.isconnected = true;
    });
  }

  isAlive() {
    return this.isconnected;
  }

  async get(key) {
    return util.promisify(this.client.GET).bind(this.client)(key);
  }

  async set(key, value, duration) {
    try {
      await this.client.set(key, value, 'EX', duration);
    } catch (error) {
      console.error('Error setting key:', error);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  }
}

// export default { RedisClient as redisClient };
const redisClient = new RedisClient();
export default redisClient;
