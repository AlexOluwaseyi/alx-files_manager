const express = require('express');
const app = express();

const port = process.env.PORT;

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

app.listen(port, 5000);
