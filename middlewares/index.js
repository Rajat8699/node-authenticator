const express = require('express');
const passport = require('passport');

const setupMiddleware = (app) => {
  app.use(express.json());
  app.use(passport.initialize());
};

module.exports = { setupMiddleware };