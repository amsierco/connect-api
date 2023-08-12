require("dotenv").config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const logger = require('morgan');
const path = require('path');
const createError = require('http-errors');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Router imports
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const profileRouter = require('./routes/profile');
const friendRouter = require('./routes/friend');
const notificationRouter = require('./routes/notification');

// Set up mongoose connection
const mongoDB = process.env.DATABASE_CONNECTION;
mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error"));

// Cors
// https://expressjs.com/en/resources/middleware/cors.html#enabling-cors-pre-flight
app.use(cors());

// Passport strategies
passport.use(
  new GoogleStrategy(
    {
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);
app.use(passport.initialize());

// Middleware
app.use(express.json());
app.use(helmet());
app.use(logger("common"));

app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/profile', profileRouter);
app.use('/api/friend', friendRouter);
app.use('/api/notifications', notificationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
});

module.exports = app;
