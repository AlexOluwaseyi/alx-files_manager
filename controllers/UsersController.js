import crypto from 'crypto';
import dbClient from '../utils/db';
import Queue from 'bull';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    const user = await dbClient.db.collection('users').findOne({ email });
    if (user) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    const newUser = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    await userQueue.add({ userId: newUser.insertedId });

    // Respond with new user details
    return res.status(201).send({
      id: newUser.insertedId,
      email,
    });
  }
}

export default UsersController;
