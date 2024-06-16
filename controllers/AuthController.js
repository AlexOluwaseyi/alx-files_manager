import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
    static async connect(req, res) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
  
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [email, password] = credentials.split(':');
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
  
      const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
  
      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
  
      return res.status(200).send({ token });
    }
  
    static async disconnect(req, res) {
      const token = req.headers['x-token'];
      if (!token || !await redisClient.get(`auth_${token}`)) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
  
      await redisClient.del(`auth_${token}`);
      return res.sendStatus(204);
    }
  
    static async getMe(req, res) {
      const token = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${token}`);
      
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
  
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        return res.status(401).send({ error: 'Unauthorized' });
      }
  
      return res.status(200).send({
        id: user._id,
        email: user.email,
      });
    }
  }

export default UsersController;
