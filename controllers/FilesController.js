const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FilesController {

    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const id = await redisClient.get(key);
        if (!id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await dbClient.db().collection('users').findOne({ _id: new ObjectId(id) });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {name, type, parentId = 0, isPublic = false, data} = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing or invalid type' });
        }

        if (!data && type !== 'folder') {
            return res.status(400).json({ error: 'Missing data' });
        }

        // Parent file validation
        if (parentId !== 0) {
            const parentFile = await dbClient.db().collection('files').findOne({ _id: new ObjectId(parentId) });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        if (type === 'folder') {
            // Insert folder in DB
            const newFolder = {
                name: name,
                type: type,
                userId: user._id,
                isPublic: isPublic,
                parentId: parentId
            };

            const result = await dbClient.db().collection('files').insertOne(newFolder);
            return res.status(201).json({
                id: result.insertedId,
                name: name,
                type: type,
                userId: user._id,
                isPublic: isPublic,
                parentId: parentId
            });
        } else {
            // Handle file/image upload
            const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
            const fileName = uuidv4(); // Generate a UUID for the file name
            const filePath = path.join(folderPath, fileName);

            // Ensure the directory exists
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // Write the file to disk
            fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

            // Insert file in DB
            const newFile = {
                name: name,
                type: type,
                userId: user._id,
                isPublic: isPublic,
                parentId: parentId,
                localPath: filePath
            };

            const result = await dbClient.db().collection('files').insertOne(newFile);
            return res.status(201).json({
                id: result.insertedId,
                name: name,
                type: type,
                userId: user._id,
                isPublic: isPublic,
                parentId: parentId,
                localPath: filePath
            });
        }
    }
}

module.exports = FilesController;
