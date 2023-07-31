require("dotenv").config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const logger = require('morgan');
const path = require('path');
const createError = require('http-errors');
const cors = require('cors');

// Router imports
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');

// Set up mongoose connection
const mongoDB = process.env.DATABASE_CONNECTION;
mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error"));

// Cors
// https://expressjs.com/en/resources/middleware/cors.html#enabling-cors-pre-flight
app.use(cors());

// Middleware
app.use(express.json());
app.use(helmet());
app.use(logger("common"));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
