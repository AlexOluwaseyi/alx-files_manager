import Router from express;
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postFile(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;
    
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

    let localPath;
    
    if (type === 'folder') {
      // ... add folder document to DB ...
      return res.status(201).send(newFile);
    } else {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      
      const filename = uuidv4();
      localPath = path.join(folderPath, filename);
      
      // Decode Base64 data and write file to disk
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer);
      
      // ... add file document to DB with localPath ...
      return res.status(201).send(newFile);
    }
  }
}

export default FilesController
