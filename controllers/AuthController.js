import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static getConnect(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();
    return res.status(200).send({ redis: redisAlive, db: dbAlive });
  }

  static async getDisconnect(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    return res.status(200).send({ users, files });
  }

  static async getMe(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    return res.status(200).send({ users, files });
  }
}

export default AuthController;
