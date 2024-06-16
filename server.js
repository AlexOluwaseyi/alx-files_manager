const express = require('express');

const app = express();

const port = process.env.PORT;

const indexRoutes = require('./routes/index');

app.use('/', indexRoutes);

app.listen(5000);
