const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('./../utils/appError');
const util = require('util');

// SIGNUP FUNCTION ------------------
// Define an asynchronous function for handling user sign-up.
// Using async allows us to use await for asynchronous operations like database interactions and JWT signing.
exports.signUp = async (req, res, next) => {
  try {
    // Create a new user in the database.
    // Explicitly specifying each field from req.body prevents mass assignment vulnerabilities,
    // where an attacker could pass additional fields to manipulate the database record.
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt
    });

    // Generate a JSON Web Token (JWT) for the new user.
    // jwt.sign() method is used to create the token. It takes three arguments:
    // 1. The payload: Here, it's the user's ID, which identifies the user.
    // 2. The secret key: Loaded from an environment variable for security.
    // 3. Options: expiresIn defines the token's validity period. After 2 days, the token expires and cannot be used.
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '2 days'
    });

    // Send a response with status code 201 (Created), including the token and user data.
    // This confirms the user was registered successfully.
    res.status(201).json({
      status: `success`,
      token: token,
      data: {
        data: newUser,
        message: `User registered successfully`
      }
    });
  } catch (err) {
    // If an error occurs (e.g., due to invalid data or database issues), send a 400 response.
    // This indicates a bad request from the client with the error message.
    res.status(400).json({
      status: `fail`,
      message: err.message
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    // Retrieve email and password from request body
    const email = req.body.email;
    const password = req.body.password.toString(); // Convert password to string to ensure compatibility with bcrypt

    // 1) Verify both email and password are provided in the request
    if (!email || !password) {
      // If either is missing, return a 400 Bad Request response
      return res.status(400).json({
        status: `fail`,
        message: `Please provide a password and email`
      });
    }

    // 2) Attempt to find the user by email and explicitly select the password field
    // The password field is not selected by default for security reasons, hence the '+password'
    const user = await User.findOne({ email: email }).select(`+password`);

    // Check if the user exists and the password is correct
    // Note: We avoid calling the password check method directly on a potentially null user object
    if (!user || !(await user.checkPasswordIsEqual(password, user.password))) {
      // If the user doesn't exist or the password is incorrect, return a 401 Unauthorized response
      return res.status(401).json({
        status: `fail`,
        message: `Email or password is not correct`
      });
    }

    // 3) Generate a JWT for the user if authentication is successful
    // jwt.sign() takes three parameters:
    // - A payload to include in the token, here it's the user's ID
    // - A secret key to sign the token, typically stored in an environment variable for security
    // - An options object, where we set the token to expire in 2 days
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: `2 days`
    });

    // 4) Respond with a 200 OK status, the token, and user data
    // This indicates successful authentication
    res.status(200).json({
      status: `success`,
      token: token,
      data: {
        user: user
      }
    });
  } catch (err) {
    // Log the error and return a 401 Unauthorized response if an exception occurs
    console.log(err);
    return res.status(401).json({
      status: `fail`,
      message: err.message
    });
  }
};

// This controller function is designed to protect routes that require user authentication.
exports.protect = async (req, res, next) => {
  try {
    // Step 1: Attempt to retrieve the JWT token from the Authorization header
    let token;
    // Check if the Authorization header exists and starts with 'Bearer'
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract the token part after 'Bearer '
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found, prevent access and return an error message
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access', 401)
      );
    }

    // Step 2: Validate the token to ensure it's legitimate and not expired
    // 'jwt.verify' is promisified to work with async/await syntax
    const decodedToken = await util.promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    // Log the decoded token for debugging purposes
    console.log('Decoded token is here');
    console.log(decodedToken);

    // Step 3: Check if the user associated with the token still exists
    const freshUser = await User.findById(decodedToken.id); // Use token.id to find the current user in the database
    // If the user doesn't exist, prevent access and return an error message
    if (!freshUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist',
          401
        )
      );
    }

    // Step 4: Verify if the user has changed their password after the token was issued
    if (freshUser.changedPasswordAfter(decodedToken.iat)) {
      // If the password was changed, prevent access and prompt re-login
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    // Grant access to the protected route
    // Attach the user object to the request for use in downstream handlers
    req.user = freshUser;
    next();
  } catch (err) {
    // Log any errors for debugging and return a generic error message
    console.log(err);
    return next(new AppError('Authentication failed', 401));
  }
};
