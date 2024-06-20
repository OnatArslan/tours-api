const User = require('./../models/userModel');

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
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
