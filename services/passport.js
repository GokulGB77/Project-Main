
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
        console.log("Profile:",profile)
        let user = await Userdb.create({ googleId: profile.id, });
        if (user) {
          user.name = profile.displayName;
          user.email = profile.emails[0].value;
          // ...
          user = await user.save();
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);


