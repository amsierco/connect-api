require("dotenv").config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const logger = require('morgan');
const path = require('path');
const createError = require('http-errors');

// Router imports
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');

// Set up mongoose connection
const mongoDB = process.env.DATABASE_CONNECTION;
mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error"));

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
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);

// Verify Token middleware function
// export default function verifyToken(req, res, next) {
  // // Get auth header value
  // const bearerHeader = req.headers['authorization'];
  // // Check if bearer is undefined
  // if(typeof bearerHeader !== 'undefined') {
  //   // Split at the space
  //   const bearer = bearerHeader.split(' ');
  //   // Get token from array
  //   const bearerToken = bearer[1];
  //   // Set the token
  //   req.token = bearerToken;
    
  //   const decoded_user = jwt.verify(token, process.env.TOKEN_KEY);
  //   //req.user = decoded_user;

  //   // Next middleware
  //   next();
  // } else {
  //   // Forbidden
  //   res.sendStatus(403);
  // }
  // next();
// }


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
