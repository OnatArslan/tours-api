const User = require('./../models/userModel');

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      // If we use req.body in once this will create big securutiy flaw
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });
    res.status(201).json({
      status: `success`,
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
