const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// name email photo password passwordConfirm
const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: {
        values: [`user`, `guide`, `lead-guide`, `admin`]
      },
      default: `user`
    },
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
    passwordResetToken: {
      type: String
    },
    passwordResetExpires: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
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

//
userSchema.methods.changedPasswordAfter = function(JWTTimestampt) {
  if (this.passwordChangedAt) {
    const changedTimestampt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestampt < changedTimestampt;
  }
  // False means not changed
  return false;
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

// Adding a method to userSchema to create a password reset token
userSchema.methods.createPasswordResetToken = function() {
  // Generate a random token using crypto
  const resetToken = crypto.randomBytes(32).toString(`hex`);

  // Hash the token and set it to the user's passwordResetToken field for secure storage
  // This hashed token will be saved in the database for verification when the user resets their password
  this.passwordResetToken = crypto
    .createHash(`sha256`)
    .update(resetToken)
    .digest(`hex`);

  // Logging the reset token and its hashed version for debugging purposes
  // Note: In production, sensitive information like tokens should not be logged
  console.log({ resetToken }, this.passwordResetToken);

  // Set the expiration time for the reset token to 10 minutes from the current time
  // This adds a layer of security by limiting the time window in which the token can be used
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the unhashed reset token
  // This token will be sent to the user (e.g., via email) to allow them to reset their password
  return resetToken;
};

const User = mongoose.model(`User`, userSchema);

module.exports = User;
