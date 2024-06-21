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
      passwordConfirm: req.body.passwordConfirm
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

// LOGIN REQUIRED CONTROLLER
exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it exist
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith(`Bearer`)
    ) {
      token = req.headers.authorization.split(` `)[1];
    }
    if (!token) {
      return next(
        new AppError(`You are not logged in! Please log in to get access`, 401)
      );
    }

    // 2) VALIDATE TOKEN VERIFICATION
    const decodedToken = await util.promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    console.log(`Decoded token is here`);
    console.log(decodedToken);
    // 3) Check if user still exist
    const freshUser = await User.findById(decodedToken.id); // token.id is our guide to access current user
    if (!freshUser) {
      return next(
        new AppError(`The user belong to this token does no longer exist`, 401)
      );
    }

    // 4) Check if user changed password after the JWToken was issued

    next();
  } catch (err) {
    return next(new AppError(err.message), 401);
  }
};
