const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// Import the express module to create a router
const router = express.Router();

// Define a POST route for user signup
// This route listens for POST requests on the `/signup` path and uses the signUp method from authController to handle the request.
router.post(`/signup`, authController.signUp);

// Define a POST route for user login
// This route listens for POST requests on the `/login` path and uses the signUp method from authController to handle the request.
router.post(`/login`, authController.login);

// Define routes for the base path '/'
// This chain of methods applies to the base path '/' for different HTTP methods.
router
  .route('/')
  // GET request handler for fetching all users
  // When a GET request is made to '/', it's handled by the getAllUsers method of userController.
  .get(userController.getAllUsers)
  // POST request handler for creating a new user
  // When a POST request is made to '/', it's handled by the createUser method of userController.
  .post(userController.createUser);

// Define routes for paths with an ID parameter (e.g., '/:id')
// This chain of methods applies to paths that include an ID, allowing for operations on specific users.
router
  .route('/:id')
  // GET request handler for fetching a single user by ID
  // When a GET request is made to '/:id', it's handled by the getUser method of userController, which fetches a user by their ID.
  .get(userController.getUser)
  // PATCH request handler for updating a user by ID
  // When a PATCH request is made to '/:id', it's handled by the updateUser method of userController, which updates a user's information based on their ID.
  .patch(userController.updateUser)
  // DELETE request handler for removing a user by ID
  // When a DELETE request is made to '/:id', it's handled by the deleteUser method of userController, which removes a user based on their ID.
  .delete(userController.deleteUser);

// Export the router
// This makes the router available for use in other parts of the application, typically by importing it in the main server file.
module.exports = router;
