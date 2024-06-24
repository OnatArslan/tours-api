// Importing necessary modules
const express = require('express'); // Express framework to handle routes
// Controllers
const tourController = require('./../controllers/tourController'); // Controller for tour-related operations
const authController = require('./../controllers/authController'); // Controller for authentication and authorization
const reviewController = require('./../controllers/reviewController');
// Routers for nested routes
const reviewRouter = require('./../routes/reviewRoutes');

// Creating a new router object to handle routes for tours
const router = express.Router();

// Nested route with express (Advanced)
router.use(`/:tourId/reviews`, reviewRouter); // This code is same as in app.js file
// app.use('/api/v1/tours', tourRouter); This is in app.js file // Basicly we use reviewRouter in tour routes if request be like /:tourId/reviews

// Route for getting all tours and creating a new tour
router
  .route('/')
  .get(tourController.getAllTours) // GET request to retrieve all tours, with authentication
  .post(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`),
    tourController.createTour
  ); // POST request to create a new tour

// Route for getting top 5 cheap tours
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours); // GET request to retrieve top 5 cheap tours

// Route for getting tour statistics
router.route('/tour-stats').get(tourController.getTourStats); // GET request to retrieve tour statistics

// Route for getting monthly plan for a given year
// GET request to retrieve monthly plan for tours
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`),
    tourController.getMonthlyPlan
  );

// Routes for specific tour identified by its ID
router
  .route('/:id')
  .get(tourController.getTour) // GET request to retrieve a single tour by its ID
  .patch(
    authController.protect,
    authController.restrictTo(`admin`, `lead-guide`),
    tourController.updateTour
  ) // PATCH request to update a tour by its ID
  .delete(
    authController.protect, // Middleware to protect the route, ensuring only authenticated users can access
    authController.restrictTo('admin', 'lead-guide'), // Middleware to restrict access to certain roles
    tourController.deleteTour // DELETE request to delete a tour by its ID
  );

// Exporting the router to be used in the main application file
module.exports = router;
