const session = require('express-session');
const MongoStore = require('connect-mongo');

module.exports = (app) => {
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // set true in prod with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  }));
};