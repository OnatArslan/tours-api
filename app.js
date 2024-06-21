const express = require('express');
const morgan = require('morgan');
const AppError = require(`./utils/appError`);

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const globalErrorHandler = require(`./controllers/errorController`);

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handling wrong requests - We must place this middleware all routes because
app.all(`*`, (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // console.log(err.stack); // err.stack show us where the error happened

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404)); // When we use a error handler middleware we must use next() with error parameter
});

// ERROR HANDLER MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
