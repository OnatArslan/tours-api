const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      // If we use req.body in once this will create big securutiy flaw
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: `2 days`
    });

    res.status(201).json({
      status: `success`,
      token: token,
      data: {
        data: newUser,
        message: `User registered succesfully`
      }
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err.message
    });
  }
};
