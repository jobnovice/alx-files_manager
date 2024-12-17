const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '27017';
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}`;

        this.dbName = database;
        this.client = new MongoClient(url, { useUnifiedTopology: true });
        this.connected = false;

        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            this.connected = true;
            console.log('Successfully connected to MongoDB');
        } catch (err) {
            console.error(`Failed to connect to MongoDB: ${err}`);
            this.connected = false;
        }
    }

    isAlive() {
        return this.connected && this.client.topology.isConnected();
    }

    db() {
        if (!this.isAlive()) {
            throw new Error('Database connection is not ready');
        }
        return this.client.db(this.dbName);
    }

    async nbUsers() {
        try {
            const result = await this.db().collection('users').countDocuments();
            return result;
        } catch (err) {
            console.error(`Failed to retrieve user count: ${err}`);
            return 0;
        }
    }

    async nbFiles() {
        try {
            const result = await this.db().collection('files').countDocuments();
            return result;
        } catch (err) {
            console.error(`Failed to retrieve file count: ${err}`);
            return 0;
        }
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
