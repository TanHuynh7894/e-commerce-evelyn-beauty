const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { Account } = require("../models"); // Sequelize models
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // 👈 Đảm bảo biến này có giá trị
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // 👈 Cả biến này nữa
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        let account = await Account.findOne({ where: { email } });

        if (!account) {
          account = await Account.create({
            accountId: "AC" + Date.now(),
            name,
            email,
            password: "GOOGLE_USER",
            role: "CU",
            googleId,
          });
        }

        return done(null, account);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Lưu vào session
passport.serializeUser((user, done) => {
  done(null, user.accountId);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Account.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;