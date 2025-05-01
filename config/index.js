const sequelize = require('./database');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Role = require('../models/role');
const User = require('../models/user');

const GOOGLE_AUTH_CONFIG = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
};

const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    await Role.bulkCreate([
      { name: 'admin' },
      { name: 'user' },
    ]);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const configurePassport = () => {
  passport.use(new GoogleStrategy(
    GOOGLE_AUTH_CONFIG,
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          where: { googleId: profile.id },
          include: Role,
        });

        if (!user) {
          const userRole = await Role.findOne({ where: { name: 'user' } });
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            dateOfBirth: null, // Google doesn't provide DOB
            phone: null, // Google doesn't provide phone
            profilePicture: profile.photos[0]?.value,
            RoleId: userRole.id,
          });
          user.Role = userRole;
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
};

module.exports = { initializeDatabase, configurePassport };