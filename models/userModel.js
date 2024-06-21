const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
      minLength: [8, `Passoword must include at least 8 characters`],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, `Please confirm your password`],
      minLength: [8, `Passoword must include at least 8 characters`],
      validate: {
        validator: function(val) {
          //This is only work for save() or create() method not update()
          return val === this.password;
        },
        message: `Passwords are not match`
      }
    },
    photo: {
      type: String
    }
  },
  {}
);

// CHECK PASSOWORDS ARE EQUAL FUNCTION
// INSTANCE METHOD
// Inside the user model definition, assuming there's a method like this:
userSchema.methods.checkPasswordIsEqual = async function(
  candidatePassword,
  userPassword
) {
  // bcrypt.compare function is used here to check if the candidate password matches the user's hashed password.
  // It takes two parameters:
  // 1. candidatePassword: The plain text password provided by the user attempting to log in.
  // 2. userPassword: The hashed password stored in the database for the user.
  // bcrypt.compare then hashes the candidatePassword with the same salt used for the userPassword and compares the result.
  // If both hashes match, it returns true, indicating the passwords are equal.
  // If they don't match, it returns false, indicating the login attempt should be rejected.
  return await bcrypt.compare(candidatePassword, userPassword);
};

// HASH THE PASSWORD WITH PRE SAVE MIDDLEWARE
// Define a pre-save middleware for the user schema.
// This middleware will execute before a user document is saved to the database.
// USE ASYNC FUNCTION MUST USEEE
userSchema.pre(`save`, async function(next) {
  // Check if the password field has been modified.
  // If not, skip the hashing process and proceed to the next middleware or save operation.
  // This is to avoid re-hashing the password if it hasn't changed.
  if (!this.isModified(`password`)) {
    return next();
  }

  // If the password is modified, hash it using bcrypt with a cost factor of 12.
  // A higher cost factor increases the hashing time, enhancing security but requiring more processing power.
  // The hashed password replaces the plain text password in the document.
  this.password = await bcrypt.hash(this.password, 12);

  // Remove the passwordConfirm field from the document.
  // This field is used for validation purposes only and should not be stored in the database.
  this.passwordConfirm = undefined;

  // Proceed to the next middleware or complete the save operation.
  next();
});

const User = mongoose.model(`User`, userSchema);

module.exports = User;
