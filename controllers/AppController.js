import redisClient from './utils/redis';
import dbClient from './utils/db';

// const express = require('express');
// const app = express();

// app.get('/status')
if (redisClient.isAlive && dbClient.isAlive){
    app.get('/status', (req, res) => {
        res.status(200).send({ "redis": true, "db": true });
    });

    app.get('/stats', (req, res) => {
        res.status(200).send({ "users": 12, "files": 1231 });
    });
    app.get
}
