const express = require('express');
const morgan = require('morgan');
const AppError = require(`./utils/appError`);
const rateLimit = require('express-rate-limit');

const path = require(`path`);

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const globalErrorHandler = require(`./controllers/errorController`);

const app = express();

// We tell express which view engine we using

app.set('view engine', 'pug');

app.set(`views`, path.join(__dirname, `views`));

// 1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, `public`)));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: `Too many request from this IP, please try again later`
});
app.use(`/api`, limiter);

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.get(`/`, (req, res, next) => {
  res.status(200).render(`base`, {
    tour: 'The forest hiker',
    user: 'Jonas'
  });
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use(`/api/v1/reviews`, reviewRouter);

// Handling wrong requests - We must place this middleware all routes because
app.all(`*`, (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // console.log(err.stack); // err.stack show us where the error happened

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404)); // When we use a error handler middleware we must use next() with error parameter
});

// ERROR HANDLER MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
