const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AppController {
	static getStatus(req, res) {
		try {
			res.status(200).json({
			redis: redisClient.isAlive(),
			db: dbClient.isAlive()
			});
		}catch(er){
			console.error('there might some issues with it', er);
		}
	
	}
	
	static async getStats(req, res){
		try {

			const usercount = await dbClient.nbUsers();
			const filecount = await dbClient.nbFiles();
			res.status(200).json({
				users: usercount,
				files: filecount
			});
		}catch(err) {
			console.error('Error fetching', err);
			res.status(500).json({err: 'Unable to retrieve statistics'});
		}
	}
}
module.exports = AppController;
