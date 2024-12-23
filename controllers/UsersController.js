const express = require('express');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
    static async postNew(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email) {
                return res.status(400).json({ error: 'Missing email' });
            }
            if (!password) {
                return res.status(400).json({ error: 'Missing password' });
            }

            // Access the database and users collection
            const db = dbClient.db();
            const usersCollection = db.collection('users');

            // Check if the user already exists
            const existingUser = await usersCollection.findOne({ email: email });
            if (existingUser) {
                return res.status(400).json({ error: 'Already exist' });
            }

            // Hash the password
            const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

            // Insert new user
            const result = await usersCollection.insertOne({
                email: email,
                password: hashedPassword,
            });

            // Return success response
            return res.status(201).json({
                id: result.insertedId,
                email: email,
            });

        } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
    static async getMe(req, res){
         const token = req.headers['x-token'];
         const key = `auth_${token}`;
	 const id = await redisClient.get(key);
	 if (!id ){
              return res.status(401).json({error: 'Unauthorized'});
	 }
	 const user = await dbClient.db().collection('users').findOne({_id: new ObjectId(id) });		 
	 if (!user){
		 return res.status(401).json({error: 'Unauthorized'});
	 }
	 return res.status(201).json({id: user._id, email: user.email});
    }
}

module.exports = UsersController;
