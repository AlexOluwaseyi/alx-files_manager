import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// const fileQueue = new Queue('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).send({ error: 'Missing data' });
    }

    // ... handle parentId checks ...

    // const localPath;

    if (type === 'folder') {
      // ... add folder document to DB ...
      const result = await dbClient.db.collection('files').insertOne({
        userId,
        name,
        type,
        isPublic,
        parentId,
      });

      // Define newFile with the result from DB
      const newFile = {
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      };

      return res.status(201).send(newFile);
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);

    // Decode Base64 data and write file to disk
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, buffer);

    const result = await dbClient.db.collection('files').insertOne({
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    });

    // Define newFile with the result from DB
    const newFile = {
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };
      // ... add file document to DB with localPath ...
    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const limit = 20;
    const skip = page * limit;

    const files = await dbClient.db.collection('files')
      .find({ userId, parentId })
      .skip(skip)
      .limit(limit)
      .toArray();

    return res.status(200).send(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const result = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: fileId, userId },
      { $set: { isPublic: true } },
      { returnOriginal: false },
    );

    if (!result.value) {
      return res.status(404).send({ error: 'Not found' });
    }

    return res.status(200).send(result.value);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const result = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: fileId, userId },
      { $set: { isPublic: false } },
      { returnOriginal: false },
    );

    if (!result.value) {
      return res.status(404).send({ error: 'Not found' });
    }

    return res.status(200).send(result.value);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }

    const token = req.headers['x-token'];
    const userId = token ? await redisClient.get(`auth_${token}`) : null;

    if (file.isPublic === false && (!userId || userId !== file.userId.toString())) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }

    let size;
    // Check if size parameter is valid and modify the localPath accordingly
    if (size && ['500', '250', '100'].includes(size)) {
      const sizePath = `${file.localPath}_${size}`;
      if (!fs.existsSync(sizePath)) {
        return res.status(404).send({ error: 'Not found' });
      }
      file.localPath = sizePath; // Update localPath to the resized file path
    } else if (size) {
      return res.status(400).send({ error: 'Invalid size parameter' });
    }

    if (!fs.existsSync(file.localPath)) {
      return res.status(404).send({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);

    return fs.createReadStream(file.localPath).pipe(res);
  }
}

export default FilesController;
