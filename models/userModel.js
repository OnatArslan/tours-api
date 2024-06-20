const mongoose = require('mongoose');
const validator = require('validator');

// name email photo password passwordConfirm
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `Name is required`],
      unique: [true, `This name was taken`]
    },
    email: {
      type: String,
      required: [true, `Email is required`],
      unique: [true, `This name was taken`],
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: `This is not a legit email`
      }
    },
    password: {
      type: String,
      required: [true, `Password is required`],
      minLength: [8, `Passoword must include at least 8 characters`]
    },
    passwordConfirm: {
      type: String,
      required: [true, `Please confirm your password`],
      minLength: [8, `Passoword must include at least 8 characters`]
    },
    photo: {
      type: String
    }
  },
  {}
);

const User = mongoose.model(`User`, userSchema);

module.exports = User;
