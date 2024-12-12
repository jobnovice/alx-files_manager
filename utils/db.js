const { MongoClient } = require('mongodb');

// let's create a new class that handles all ot
class DBClient {
	constructor() {
		const host = process.env.DB_HOST || 'localhost';
		const port = process.env.DB_PORT || '27017';
		const database = process.env.DB_DATABASE || 'files_manager';
		const url = `mongodb://${host}:${port}`;
		this.dbName = process.env.DB_DATABASE || 'files_manager';	
		this.client = new MongoClient(url);
		
		this.client.connect().catch((err) => {
			console.error(`Failed to connect ${err}`);
		});
	}

	isAlive() {
		return this.client.isConnected();
	}
		
	async nbUsers() {
		const numResult =  await this.client.db(this.dbName).collection('users').countDocuments({}).catch((err) => {
			console.error(`Failed to retrieve the document ${err}`)
		});;
		return numResult;
	}
	
	async nbFiles() {
		const finRes = await this.client.db(this.dbName).collection('files').countDocuments({}).catch((err) => {
			console.error(`Failed to retrieve the document ${err}`)
		});;

		return finRes;
	}

}

const dbclient = new DBClient();
module.exports = dbclient;
