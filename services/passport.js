
const Userdb = require("../models/userModel")
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
require('dotenv').config()
passport.serializeUser((user, done) => {
  done(null, user);
})
passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        // Find existing user by email
        let existingUser = await Userdb.findOne({ email: profile.emails[0].value });

        if (!existingUser) {
          // Create a new user if not found
          let newUser = new Userdb({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            is_verified: 1, // Assuming this is a boolean field
          });
          // Save the new user to the database
          newUser = await newUser.save();
          done(null, newUser);
        } else {
          // If user already exists, return the existing user
          done(null, existingUser);
        }
      } catch (err) {
        // Handle errors
        done(err);
      }
    }
  )
);


