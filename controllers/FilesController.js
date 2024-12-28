const dbClient = require("../utils/db");
const redisClient = require("../utils/redis");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers["x-token"];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (!id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await dbClient
      .db()
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing name" });
    }

    if (!type || !["folder", "file", "image"].includes(type)) {
      return res.status(400).json({ error: "Missing or invalid type" });
    }

    if (!data && type !== "folder") {
      return res.status(400).json({ error: "Missing data" });
    }

    // Parent file validation
    if (parentId !== 0) {
      const parentFile = await dbClient
        .db()
        .collection("files")
        .findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: "Parent not found" });
      }
      if (parentFile.type !== "folder") {
        return res.status(400).json({ error: "Parent is not a folder" });
      }
    }

    if (type === "folder") {
      // Insert folder in DB
      const newFolder = {
        name: name,
        type: type,
        userId: user._id,
        isPublic: isPublic,
        parentId: parentId,
      };

      const result = await dbClient
        .db()
        .collection("files")
        .insertOne(newFolder);
      return res.status(201).json({
        id: result.insertedId,
        name: name,
        type: type,
        userId: user._id,
        isPublic: isPublic,
        parentId: parentId,
      });
    } else {
      // Handle file/image upload
      const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";
      const fileName = uuidv4(); // Generate a UUID for the file name
      const filePath = path.join(folderPath, fileName);

      // Ensure the directory exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Write the file to disk
      fs.writeFileSync(filePath, Buffer.from(data, "base64"));

      // Insert file in DB
      const newFile = {
        name: name,
        type: type,
        userId: user._id,
        isPublic: isPublic,
        parentId: parentId,
        localPath: filePath,
      };

      const result = await dbClient.db().collection("files").insertOne(newFile);
      return res.status(201).json({
        id: result.insertedId,
        name: name,
        type: type,
        userId: user._id,
        isPublic: isPublic,
        parentId: parentId,
        localPath: filePath,
      });
    }
  }
  static async getShow(req, res) {
    const token = req.headers["x-token"];
    const key = `auth_${token}`;

    const { id } = req.params;

    const uid = await redisClient.get(key);
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await dbClient
      .db()
      .collection("users")
      .findOne({ _id: new ObjectId(uid) });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = await dbClient
      .db()
      .collection("files")
      .findOne({ _id: new ObjectId(id) });
    if (!file) {
      return res.status(404).json({ error: "Not found" });
    }

    if (!file.userId.equals(user._id)) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(file);
  }
  static async getIndex(req, res) {
    const token = req.headers["x-token"];
    const { parentId = 0, page = 0 } = req.query;
    const key = `auth_${token}`;

    // Validate user authentication
    const uid = await redisClient.get(key);
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await dbClient
      .db()
      .collection("users")
      .findOne({ _id: new ObjectId(uid) });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Convert parentId if necessary
    const parentIdQuery = parentId === 0 ? 0 : parentId;

    try {
      // Pagination setup
      const skip = Math.max(0, page * 20); // Adjust based on page numbering
      if (parentIdQuery === 0){
	const allfiles = await dbClient
        .db()
        .collection("files")
        .aggregate([
          { $match: { userId: user._id } },
          { $skip: skip },
          { $limit: 20 },
        ])
        .toArray();
	return res.json(allfiles);
      }
      // Aggregate query
      const files = await dbClient
        .db()
        .collection("files")
        .aggregate([
          { $match: { parentId: parentIdQuery, userId: user._id}},
          { $skip: skip },
          { $limit: 20 },
        ])
        .toArray();

      // Return files or empty array
      return res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  static async putPublish(req, res){
	const token = req.headers["x-token"];
	const key = `auth_${token}`;
	const uid = await redisClient.get(key);
	const { id } = req.params;
	if (!uid){
		return res.status(404).json({error: 'Unauthorized'});
	}
	
	const user = await dbClient.db().collection("users").findOne({_id: new ObjectId(uid)});	
	if (!user){
		return res.status(401).json({error: 'Unauthorized'});
	}
	
	const file = await dbClient.db().collection('files').findOne({_id: new ObjectId(id)});
		
	if (!file){
		console.log('the file your looking does not exist');
		return res.status(404).json({error: 'Not found'});
	}
	        const updated = await dbClient.db().collection('files').updateOne({_id:                                                                         file._id},
                                                                        {$set: {isPublic: true}});
	const updatedFile = await dbClient.db().collection('files').findOne({_id: file._id});
    return res.status(200).json(updatedFile);
  }
  static async putUnpubilsh(req, res){
	const token = req.headers["x-token"];
	const key = `auth_${token}`;
	const { id } = req.params;
	const uid = await redisClient.get(key);
	
	const user = await dbClient.db().collection('users').findOne({_id: new ObjectId(uid)});

	if (!user){
		return res.status(401).json({error: 'Unauthorized'});
	}
	const file = await dbClient.db().collection('files').findOne({_id: new ObjectId(id)});
  	if (!file){
		return res.status(404).json({error: 'Not found'});
	}

	const updated = await dbClient.db().collection('files').updateOne({_id: 									file._id}, 
									{$set: {isPublic: false}});

	const updatedFile = await dbClient.db().collection('files').findOne({_id: file._id});
    return res.status(200).json(updatedFile);

  }	
}

module.exports = FilesController
