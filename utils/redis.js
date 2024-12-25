const { createClient } = require('redis');

class RedisClient {
  constructor() {
    // Create Redis client
    this.client = createClient();

    // Handle client connection errors
    this.client.on('error', (err) => {
      console.error(`Redis Client Error: ${err}`);
    });

    // Establish the connection
    this.client.connect().catch((err) => {
      console.error(`Failed to connect to Redis: ${err}`);
    });
  }

  // Method to check if the client is alive
  isAlive() {
    return this.client.isOpen;
  }

  // Method to get the value of a key
  async get(key) {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`Error getting key: ${err.message}`);
      throw err;
    }
  }

  // Method to set a value with an expiration
  async set(key, value, duration) {
    try {
      return await this.client.set(key, value, {
        EX: duration, // Set expiration in seconds
      });
    } catch (err) {
      console.error(`Error setting key: ${err.message}`);
      throw err;
    }
  }

  // Method to delete a key
  async del(key) {
    try {
      return await this.client.del(key);
    } catch (err) {
      console.error(`Error deleting key: ${err.message}`);
      throw err;
    }
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
module.exports = redisClient;
