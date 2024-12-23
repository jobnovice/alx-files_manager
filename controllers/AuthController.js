const redisclient = require('../utils/redis');
const dbClient = require('../utils/db');
const sha1 = require('sha1');
const {v4: uuid4} = require('uuid');


class AuthController {
	
	static async getConnect(req, res){
		const auth = req.headers['authorization'];
		if (!auth || !auth.startsWith('Basic')) {
			return res.status(401).json({error: 'Unauthorized'});
		}		
		
		const encodedbyt = auth.split(' ')[1];
		const credential = Buffer.from(encodedbyt, 'base64').toString('utf-8');
		const [email, passw] = credential.split(':');

		const user = await dbClient.db().collection('users').findOne({email: email});
		
		if (!user || user.password !== sha1(passw) ){
			return res.status(401).json({error: 'Unauthorized'});
		}

		const randst = uuid4();
		const key = `auth_${randst}`;
		await redisclient.set(key, user._id.toString(), 86400);

		return res.status(200).json({token: randst});
		

	}

	static async getDisconnect(req, res){
		const token = req.headers['x-token'];
		if (!token){
			return res.status(401).json({error: 'Unauthorized'});
		}	
		const key = `auth_${token}`;
		const id = await redisclient.get(key);
		if (!id){
			return res.status(401).json({error: 'Unauthorized'});
		}

	 
		
		await redisclient.del(key);
		return res.status(204).send();
	
		
	}
}
module.exports = AuthController;
