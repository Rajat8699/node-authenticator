const express = require('express');
require('dotenv').config();
const passport = require('passport');
require('./controllers/auth.controller'); // Registers Google strategy

const app = express();
app.use(express.json());
app.use(passport.initialize());

app.use('/auth', require('./routes/auth.routes'));
app.use('/user', require('./routes/user.routes'));

require('./jobs/cleanup.job');

module.exports = app;
