const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
      expiresIn: `2 days`
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
    // const { email, password } = req.body; // This is ES6 object destructuring
    const email = req.body.email;
    const password = req.body.password.toString();

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: `fail`,
        message: `Please provide a password and email`
      });
    }
    // 2) Check if user exist && password is correct
    const user = await User.findOne({ email: email }).select(`+password`); // because of password select prop is false we must do it manually

    // const isCorrect = await user.checkPassowordIsEqual(password, user.password); We can not use it here because if user is undefined this will give an error

    if (!user || !(await user.checkPassowordIsEqual(password, user.password))) {
      return res.status(401).json({
        status: `fail`,
        message: `Email or password is not correct`
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: `2 days`
    });
    // 3) If everything ok, send token to client
    res.status(200).json({
      status: `success`,
      token: token,
      data: {
        user: user
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      status: `fail`,
      message: err.message
    });
  }
};
