const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const util = require('util');
const crypto = require('crypto');

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
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role
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
    // We can use req.user on middlewares after this one like restrictTo
    req.user = freshUser;
    next();
  } catch (err) {
    // Log any errors for debugging and return a generic error message
    console.log(err);
    return next(new AppError('Authentication failed', 401));
  }
};

// Define a function to restrict access to certain roles
exports.restrictTo = function(...roles) {
  // Return an asynchronous middleware function
  return async function(req, res, next) {
    try {
      // Check if the role of the current user is not included in the allowed roles
      if (!roles.includes(req.user.role)) {
        // If the user's role is not allowed, return an error and prevent further actions
        return next(
          new AppError(`You do not have permission to perform this action`, 403)
        );
      }
      // If the user has an allowed role, proceed to the next middleware or controller
      next();
    } catch (err) {
      // In case of any errors during the check, return an authorization failure error
      return next(new AppError(`Authorization failed`, 403));
    }
  };
};
// Note: `req.user` comes from a previous authentication middleware.
// This middleware authenticates the user and attaches their details to `req.user`.
// For example, after verifying a user's token, the middleware might do something like `req.user = user;`
// This makes the user's information available in `req.user` for subsequent middleware and routes.

// ----------------------------------------------------------------------------------------------------------------
exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(
        new AppError(
          `There is no user with email adress please check your adress`,
          404
        )
      );
    }
    // console.log(user); for testing

    // 2) Generate the random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      `host`
    )}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\n If you didn't forget your password, please ignore this email`;

    try {
      await sendEmail({
        email: user.email,
        subject: `Your password reset token (valid for 10 min)`,
        message: message
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(`There was an error sending the email! Try again later`),
        500
      );
    }

    res.status(200).json({
      status: `success`,
      message: `Token sent to email`
    });
  } catch (err) {
    res.status(500).json({
      status: `fail`,
      message: err.message
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    console.log(hashedToken);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gte: Date.now() }
    });
    console.log(user);
    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      console.log(`anani sikim`);

      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm; // Corrected from res.body to req.body
    user.passwordResetToken = undefined; // Clear the reset token
    user.passwordResetExpires = undefined; // Clear the token expiry time
    await user.save();

    // 3) Optionally, update changedPasswordAt property for the user in User model
    // This step depends on your User model. If you have a hook or middleware handling it, you might not need to explicitly set it here.

    // 4) Log the user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2 days'
    });

    res.status(200).json({
      status: 'success',
      token: token
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};
