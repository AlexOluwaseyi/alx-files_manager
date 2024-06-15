const { MongoClient } = require('mongodb');
require('dotenv').config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri);
    // console.log(client);
  }

  async isAlive() {
    try {
      await this.client.connect();
      this.db = this.client.db();
      console.log(`Successfully connected to database: ${this.db.databaseName}`);
      return true;
    } catch (err) {
      return false;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
