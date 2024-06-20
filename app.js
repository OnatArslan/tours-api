const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handling wrong requests - We must place this middleware all routes because
app.all(`*`, (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = `fail`;
  err.statusCode = 404;
  next(err); // When we use a error handler middleware we must use next() with error parameter
});

// ERROR HANDLER MIDDLEWARE
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

module.exports = app;
