const User = require('./../models/userModel');
const AppError = require(`./../utils/appError`);

const handlerFactory = require(`./handlerFactory`);
// Utility function to filter object properties based on allowed fields
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // Iterate over each property in the object
  Object.keys(obj).forEach(key => {
    // If the current key is in the list of allowed fields, add it to the new object
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj; // Return the filtered object
};

// Controller function to update user information, excluding password updates
exports.updateMe = async (req, res, next) => {
  try {
    // 1) Check if the request body contains password data, which is not allowed
    if (req.body.password || req.body.passwordConfirm) {
      // If password data is present, return an error and do not proceed
      return next(
        new AppError(
          `This route is not for password updates. Please use /update-password.`,
          400
        )
      );
    }
    // 2) Filter the request body to only include allowed fields for update
    const filteredBody = filterObj(req.body, `name`, `email`);
    // 3) Proceed to update the user with the filtered data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      filteredBody,
      {
        new: true, // Return the updated object
        runValidators: true // Ensure validation rules apply
      }
    );
    // 4) Respond with success and the updated user data
    res.status(200).json({
      status: `success`,
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    // Handle any errors that occur during the update process
    console.log(err);
    res.status(500).json({
      status: `fail`,
      message: err.message
    });
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.status(204).json({
      status: `success`
    });
  } catch (err) {
    res.status(500).json({
      status: `fail`,
      message: err.message
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const user = await User.find();

    res.status(200).json({
      status: 'success',
      data: {
        user: user
      }
    });
  } catch (err) {
    res.status(500).json({
      status: `Fail`,
      message: `Something went wrong`
    });
  }
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defineddddd!'
  });
};
exports.deleteUser = handlerFactory.deleteOne(User);
