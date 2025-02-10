const Redis = require('ioredis');

const redisConfig = {
    port: 6379,  // Ensure you're connecting to the correct port for job processing
    host: '127.0.0.1',
};

let client;

// Simply return the client for Bull to use
const redisOptions = {
    createClient: function () {
        if (!client) {
            console.log('Initializing Redis client on port:', redisConfig.port);
            client = new Redis(redisConfig);  // Create the Redis client here
            client.on('connect', () => {
                console.log('Redis client connected on port:', redisConfig.port);
            });
            client.on('error', (err) => {
                console.error('Redis client error:', err);
            });
        }
        return client;  // Return the same client instance
    },
};

module.exports = redisOptions;

