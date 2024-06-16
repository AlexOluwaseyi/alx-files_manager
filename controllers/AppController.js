import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
    static getStatus(req, res) {
      const redisAlive = redisClient.isAlive();
      const dbAlive = dbClient.isAlive();
      return res.status(200).send({ redis: redisAlive, db: dbAlive });
    }
  
    static async getStats(req, res) {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      return res.status(200).send({ users, files });
    }
  }
  
export default AppController;
